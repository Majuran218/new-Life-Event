using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FileStorageService _fileStorage;
    private readonly JwtService _jwt;
    private readonly PricingService _pricing;

    public EventsController(AppDbContext db, FileStorageService fileStorage, JwtService jwt, PricingService pricing)
    {
        _db = db;
        _fileStorage = fileStorage;
        _jwt = jwt;
        _pricing = pricing;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<EventListDto>>> GetEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? fromDate = null,
        [FromQuery] string? toDate = null)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        var userEmail = _jwt.GetUserEmailFromClaims(User)?.Trim().ToLowerInvariant();

        var now = DateTime.UtcNow;
        var query = _db.Events.AsNoTracking()
            .Where(e => e.IsPublished && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now) && (
                e.Visibility == "Public" ||
                (userId.HasValue && e.UserId == userId) ||
                (e.Visibility == "InviteOnly" && userId.HasValue && !string.IsNullOrEmpty(userEmail) &&
                    e.Invites.Any(i => i.InvitedEmail.Trim().ToLower() == userEmail))
            ));

        if (!string.IsNullOrEmpty(eventType))
        {
            // Support legacy types for backward compatibility
            var types = eventType == "Anniversary" ? new[] { "Anniversary", "Wedding" }
                : eventType == "Obituary" ? new[] { "Obituary", "Funeral" }
                : new[] { eventType };
            query = query.Where(e => types.Contains(e.EventType));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(term) ||
                e.Description.ToLower().Contains(term) ||
                (e.Location != null && e.Location.ToLower().Contains(term)) ||
                (e.Country != null && e.Country.ToLower().Contains(term)));
        }

        if (DateTime.TryParse(fromDate, out var fromDt))
            query = query.Where(e => e.EventDate.Date >= fromDt.Date);
        if (DateTime.TryParse(toDate, out var toDt))
            query = query.Where(e => e.EventDate.Date <= toDt.Date);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EventListDto(
                e.Id,
                e.Title,
                e.Description.Length > 200 ? e.Description.Substring(0, 200) + "..." : e.Description,
                e.EventType,
                e.EventDate,
                e.BirthDate,
                e.DeathDate,
                e.WeddingDate,
                e.Location,
                e.Country,
                e.MainImageUrl,
                e.CreatedBy,
                e.CreatedAt,
                e.Wishes.Count,
                e.Visibility
            ))
            .ToListAsync();

        return Ok(new PagedResult<EventListDto>(items, total, page, pageSize));
    }

    [HttpGet("stats/count-by-country")]
    public async Task<ActionResult<List<CountryCountDto>>> GetCountryStats()
    {
        var now = DateTime.UtcNow;
        var countries = await _db.Events
            .AsNoTracking()
            .Where(e => e.IsPublished && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now) && e.Visibility == "Public" && e.Country != null && e.Country != "")
            .Select(e => e.Country!)
            .ToListAsync();

        var stats = countries
            .GroupBy(c => c)
            .Select(g => new CountryCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        return Ok(stats);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventDetailDto>> GetEvent(int id)
    {
        var now = DateTime.UtcNow;
        var ev = await _db.Events
            .AsNoTracking()
            .Include(e => e.Wishes)
            .Include(e => e.Invites)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsPublished && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now));

        if (ev == null)
            return NotFound();

        var userId = _jwt.GetUserIdFromClaims(User);
        var userEmail = _jwt.GetUserEmailFromClaims(User)?.Trim().ToLowerInvariant();
        var isOwner = ev.UserId.HasValue && ev.UserId == userId;

        var canView = ev.Visibility == "Public" ||
            (isOwner) ||
            (ev.Visibility == "InviteOnly" && userId.HasValue && !string.IsNullOrEmpty(userEmail) &&
                ev.Invites.Any(i => i.InvitedEmail.Trim().ToLower() == userEmail)) ||
            (ev.Visibility == "Private" && isOwner);

        if (!canView)
            return NotFound();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var mainImage = ev.MainImageUrl?.StartsWith("/") == true ? baseUrl + ev.MainImageUrl : ev.MainImageUrl;

        return Ok(new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.EventType,
            ev.EventDate,
            ev.BirthDate,
            ev.DeathDate,
            ev.WeddingDate,
            ev.Location,
            ev.Country,
            mainImage,
            ev.GalleryUrls,
            ev.CreatedBy,
            ev.CreatedAt,
            ev.Wishes.OrderByDescending(w => w.CreatedAt).Select(w => new WishDto(w.Id, w.SenderName, w.Message, w.MediaUrl, w.CreatedAt)).ToList(),
            ev.Visibility,
            isOwner,
            isOwner ? ev.Invites.Select(i => i.InvitedEmail).ToList() : new List<string>()
        ));
    }

    /// <summary>Save event as draft before payment. Returns draftId for payment flow.</summary>
    [HttpPost("save-draft")]
    [Authorize]
    public async Task<ActionResult<SaveDraftResultDto>> SaveDraft([FromForm] CreateEventFormDto dto)
    {
        var option = _pricing.GetOption(dto.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration. Choose 1, 3, 7, 14, 30, or 90 days." });

        var userId = _jwt.GetUserIdFromClaims(User);
        var user = userId.HasValue ? await _db.Users.FindAsync(userId.Value) : null;
        var createdBy = user?.DisplayName ?? dto.CreatedBy ?? "Anonymous";

        string? mainImagePath = null;
        if (dto.MainImage != null)
        {
            mainImagePath = await _fileStorage.SaveFileAsync(dto.MainImage);
        }

        var galleryPaths = new List<string>();
        if (dto.GalleryImages != null)
        {
            foreach (var img in dto.GalleryImages)
            {
                var url = await _fileStorage.SaveFileAsync(img);
                if (url != null)
                    galleryPaths.Add(url);
            }
        }

        var draft = new PendingEvent
        {
            Title = dto.Title,
            Description = dto.Description,
            EventType = dto.EventType,
            EventDate = dto.EventDate,
            BirthDate = dto.BirthDate,
            DeathDate = dto.DeathDate,
            WeddingDate = dto.WeddingDate,
            Location = dto.Location,
            Country = dto.Country,
            MainImagePath = mainImagePath,
            GalleryPathsJson = galleryPaths.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(galleryPaths) : null,
            CreatedBy = createdBy,
            UserId = userId,
            Visibility = dto.Visibility ?? "Public",
            InvitedEmails = dto.InvitedEmails,
            DisplayDays = dto.DisplayDays,
            AmountPaid = option.Price
        };

        _db.PendingEvents.Add(draft);
        await _db.SaveChangesAsync();

        return Ok(new SaveDraftResultDto(draft.Id, option.Days, option.Price, option.Label));
    }

    /// <summary>Direct create disabled. Use save-draft + payments/confirm-mock flow.</summary>
    [HttpPost]
    [Authorize]
    public IActionResult CreateEvent([FromForm] CreateEventFormDto _)
    {
        return BadRequest(new { message = "Event creation requires payment. Use save-draft and proceed to payment." });
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> UpdateEvent(int id, [FromForm] UpdateEventFormDto dto)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev == null)
            return NotFound();

        var userId = _jwt.GetUserIdFromClaims(User);
        if (!ev.UserId.HasValue || ev.UserId != userId)
            return Forbid();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        string? mainImageUrl = ev.MainImageUrl;
        if (dto.MainImage != null)
        {
            var url = await _fileStorage.SaveFileAsync(dto.MainImage);
            if (url != null)
                mainImageUrl = baseUrl + url;
        }

        var galleryUrls = ev.GalleryUrls;
        if (dto.GalleryImages != null && dto.GalleryImages.Any())
        {
            var list = new List<string>();
            foreach (var img in dto.GalleryImages)
            {
                var url = await _fileStorage.SaveFileAsync(img);
                if (url != null)
                    list.Add(baseUrl + url);
            }
            if (list.Count > 0)
                galleryUrls = System.Text.Json.JsonSerializer.Serialize(list);
        }

        ev.Title = dto.Title ?? ev.Title;
        ev.Description = dto.Description ?? ev.Description;
        ev.EventType = dto.EventType ?? ev.EventType;
        if (dto.EventDate.HasValue) ev.EventDate = dto.EventDate.Value;
        ev.BirthDate = dto.BirthDate ?? ev.BirthDate;
        ev.DeathDate = dto.DeathDate ?? ev.DeathDate;
        ev.WeddingDate = dto.WeddingDate ?? ev.WeddingDate;
        ev.Location = dto.Location ?? ev.Location;
        ev.Country = dto.Country ?? ev.Country;
        ev.MainImageUrl = mainImageUrl;
        ev.GalleryUrls = galleryUrls;
        ev.Visibility = dto.Visibility ?? ev.Visibility;

        if (ev.Visibility == "InviteOnly" && dto.InvitedEmails != null)
        {
            var existingInvites = await _db.EventInvites.Where(i => i.EventId == id).ToListAsync();
            _db.EventInvites.RemoveRange(existingInvites);

            var emails = dto.InvitedEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
            foreach (var email in emails)
            {
                if (string.IsNullOrEmpty(email)) continue;
                _db.EventInvites.Add(new EventInvite { EventId = id, InvitedEmail = email });
            }
        }

        await _db.SaveChangesAsync();

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == id).Select(i => i.InvitedEmail).ToListAsync()
            : new List<string>();

        var mainImg = ev.MainImageUrl?.StartsWith("/") == true ? baseUrl + ev.MainImageUrl : ev.MainImageUrl;
        var wishes = await _db.Wishes.Where(w => w.EventId == id).OrderByDescending(w => w.CreatedAt)
            .Select(w => new WishDto(w.Id, w.SenderName, w.Message, w.MediaUrl, w.CreatedAt)).ToListAsync();

        return Ok(new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.EventType,
            ev.EventDate,
            ev.BirthDate,
            ev.DeathDate,
            ev.WeddingDate,
            ev.Location,
            ev.Country,
            mainImg,
            ev.GalleryUrls,
            ev.CreatedBy,
            ev.CreatedAt,
            wishes,
            ev.Visibility,
            true,
            invitedEmailsList
        ));
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev == null)
            return NotFound();

        var userId = _jwt.GetUserIdFromClaims(User);
        if (!ev.UserId.HasValue || ev.UserId != userId)
            return Forbid();

        _db.Events.Remove(ev);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateEventFormDto
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string EventType { get; set; } = "";
    public DateTime EventDate { get; set; }
    public int DisplayDays { get; set; } = 30; // 7, 30, or 90 - required for save-draft
    public string? Location { get; set; }
    public string? Country { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? DeathDate { get; set; }
    public DateTime? WeddingDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? Visibility { get; set; } = "Public";
    public string? InvitedEmails { get; set; } // Comma-separated emails for InviteOnly
    public IFormFile? MainImage { get; set; }
    public IEnumerable<IFormFile>? GalleryImages { get; set; }
}

public class UpdateEventFormDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? EventType { get; set; }
    public DateTime? EventDate { get; set; }
    public string? Location { get; set; }
    public string? Country { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? DeathDate { get; set; }
    public DateTime? WeddingDate { get; set; }
    public string? Visibility { get; set; }
    public string? InvitedEmails { get; set; } // Comma-separated for InviteOnly
    public IFormFile? MainImage { get; set; }
    public IEnumerable<IFormFile>? GalleryImages { get; set; }
}

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

public record CountryCountDto(string Country, int Count);

public record SaveDraftResultDto(int DraftId, int DisplayDays, decimal Price, string Label);
