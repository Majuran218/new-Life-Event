using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FileStorageService _fileStorage;
    private readonly JwtService _jwt;
    private readonly PricingService _pricing;
    private readonly StripeService _stripe;

    public PaymentsController(AppDbContext db, FileStorageService fileStorage, JwtService jwt, PricingService pricing, StripeService stripe)
    {
        _db = db;
        _fileStorage = fileStorage;
        _jwt = jwt;
        _pricing = pricing;
        _stripe = stripe;
    }

    [HttpGet("display-options")]
    [AllowAnonymous]
    public IActionResult GetDisplayOptions()
    {
        var options = _pricing.GetDisplayOptions()
            .Select(o => new { days = o.Days, price = o.Price, label = o.Label })
            .ToList();
        return Ok(options);
    }

    /// <summary>Create Stripe Checkout Session. Returns URL to redirect user to Stripe.</summary>
    [HttpPost("create-checkout-session")]
    [Authorize]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequest request, CancellationToken ct)
    {
        if (request.DraftId <= 0)
            return BadRequest(new { message = "Invalid draft ID." });

        var draft = await _db.PendingEvents.FindAsync(new object[] { request.DraftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found or expired." });

        var userId = _jwt.GetUserIdFromClaims(User);
        if (draft.UserId.HasValue && draft.UserId != userId)
            return Forbid();

        if (!_stripe.IsConfigured)
            return BadRequest(new { message = "Stripe is not configured. Contact administrator." });

        var option = _pricing.GetOption(draft.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration." });

        string? customerEmail = null;
        if (userId.HasValue)
        {
            var user = await _db.Users.FindAsync(new object[] { userId.Value }, ct);
            customerEmail = user?.Email;
        }

        var session = await _stripe.CreateCheckoutSessionAsync(draft.Id, option.Price, option.Label, customerEmail, ct);
        return Ok(new { url = session.Url });
    }

    /// <summary>Verify Stripe session and create event. Call after user returns from Stripe success redirect.</summary>
    [HttpPost("verify-session")]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> VerifySession([FromBody] VerifySessionRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.SessionId))
            return BadRequest(new { message = "Session ID is required." });

        var session = await _stripe.GetSessionAsync(request.SessionId, ct);
        if (session == null || session.PaymentStatus != "paid")
            return BadRequest(new { message = "Invalid or unpaid session." });

        var draftIdStr = session.Metadata?.GetValueOrDefault("draftId") ?? session.ClientReferenceId;
        if (string.IsNullOrEmpty(draftIdStr) || !int.TryParse(draftIdStr, out var draftId))
            return BadRequest(new { message = "Invalid session metadata." });

        return await CreateEventFromDraftAsync(draftId, ct);
    }

    /// <summary>Stripe webhook. Handle checkout.session.completed.</summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook(CancellationToken ct)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(ct);
        var sig = Request.Headers["Stripe-Signature"].FirstOrDefault();

        var stripeEvent = _stripe.ConstructWebhookEvent(json, sig ?? "") as Stripe.Event;
        if (stripeEvent == null)
            return BadRequest();

        if (stripeEvent.Type == "checkout.session.completed")
        {
            var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
            var draftIdStr = session?.Metadata?.GetValueOrDefault("draftId") ?? session?.ClientReferenceId;
            if (!string.IsNullOrEmpty(draftIdStr) && int.TryParse(draftIdStr, out var draftId))
            {
                var result = await CreateEventFromDraftAsync(draftId, ct);
                if (result.Result is OkObjectResult)
                    return Ok();
            }
        }
        return Ok();
    }

    private async Task<ActionResult<EventDetailDto>> CreateEventFromDraftAsync(int draftId, CancellationToken ct)
    {
        var draft = await _db.PendingEvents.FindAsync(new object[] { draftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found or already used." });

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var mainImageUrl = draft.MainImagePath != null
            ? (draft.MainImagePath.StartsWith("/") ? baseUrl + draft.MainImagePath : baseUrl + "/" + draft.MainImagePath.TrimStart('/'))
            : null;

        var galleryUrls = new List<string>();
        if (!string.IsNullOrEmpty(draft.GalleryPathsJson))
        {
            var paths = System.Text.Json.JsonSerializer.Deserialize<string[]>(draft.GalleryPathsJson) ?? Array.Empty<string>();
            foreach (var p in paths)
            {
                if (!string.IsNullOrEmpty(p))
                    galleryUrls.Add(p.StartsWith("http") ? p : baseUrl + (p.StartsWith("/") ? p : "/" + p));
            }
        }

        var validityEnd = DateTime.UtcNow.AddDays(draft.DisplayDays);

        var ev = new LifeEventsHub.Api.Models.Event
        {
            Title = draft.Title,
            Description = draft.Description,
            EventType = draft.EventType,
            EventDate = draft.EventDate,
            BirthDate = draft.BirthDate,
            DeathDate = draft.DeathDate,
            WeddingDate = draft.WeddingDate,
            Location = draft.Location,
            Country = draft.Country,
            MainImageUrl = mainImageUrl,
            GalleryUrls = galleryUrls.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(galleryUrls) : null,
            CreatedBy = draft.CreatedBy,
            UserId = draft.UserId,
            IsPublished = true,
            Visibility = draft.Visibility,
            DisplayDays = draft.DisplayDays,
            DisplayValidityEndDate = validityEnd
        };

        _db.Events.Add(ev);
        _db.PendingEvents.Remove(draft);
        await _db.SaveChangesAsync(ct);

        if (ev.Visibility == "InviteOnly" && !string.IsNullOrWhiteSpace(draft.InvitedEmails))
        {
            var emails = draft.InvitedEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
            foreach (var email in emails)
            {
                if (string.IsNullOrEmpty(email)) continue;
                _db.EventInvites.Add(new EventInvite { EventId = ev.Id, InvitedEmail = email });
            }
            await _db.SaveChangesAsync(ct);
        }

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == ev.Id).Select(i => i.InvitedEmail).ToListAsync(ct)
            : new List<string>();

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
            ev.MainImageUrl,
            ev.GalleryUrls,
            ev.CreatedBy,
            ev.CreatedAt,
            new List<WishDto>(),
            ev.Visibility,
            true,
            invitedEmailsList
        ));
    }

    /// <summary>Mock payment confirmation. Use when Stripe is not configured (e.g. local dev).</summary>
    [HttpPost("confirm-mock")]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> ConfirmMock([FromBody] ConfirmPaymentRequest request)
    {
        if (request.DraftId <= 0)
            return BadRequest(new { message = "Invalid draft ID." });

        var draft = await _db.PendingEvents.FindAsync(request.DraftId);
        if (draft == null)
            return NotFound(new { message = "Draft not found or expired." });

        var userId = _jwt.GetUserIdFromClaims(User);
        if (draft.UserId.HasValue && draft.UserId != userId)
            return Forbid();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var mainImageUrl = draft.MainImagePath != null
            ? (draft.MainImagePath.StartsWith("/") ? baseUrl + draft.MainImagePath : baseUrl + draft.MainImagePath)
            : null;

        var galleryUrls = new List<string>();
        if (!string.IsNullOrEmpty(draft.GalleryPathsJson))
        {
            var paths = System.Text.Json.JsonSerializer.Deserialize<string[]>(draft.GalleryPathsJson) ?? Array.Empty<string>();
            foreach (var p in paths)
            {
                if (!string.IsNullOrEmpty(p))
                    galleryUrls.Add(p.StartsWith("http") ? p : baseUrl + p);
            }
        }

        var validityEnd = DateTime.UtcNow.AddDays(draft.DisplayDays);

        var ev = new LifeEventsHub.Api.Models.Event
        {
            Title = draft.Title,
            Description = draft.Description,
            EventType = draft.EventType,
            EventDate = draft.EventDate,
            BirthDate = draft.BirthDate,
            DeathDate = draft.DeathDate,
            WeddingDate = draft.WeddingDate,
            Location = draft.Location,
            Country = draft.Country,
            MainImageUrl = mainImageUrl,
            GalleryUrls = galleryUrls.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(galleryUrls) : null,
            CreatedBy = draft.CreatedBy,
            UserId = draft.UserId,
            IsPublished = true,
            Visibility = draft.Visibility,
            DisplayDays = draft.DisplayDays,
            DisplayValidityEndDate = validityEnd
        };

        _db.Events.Add(ev);
        _db.PendingEvents.Remove(draft);
        await _db.SaveChangesAsync();

        if (ev.Visibility == "InviteOnly" && !string.IsNullOrWhiteSpace(draft.InvitedEmails))
        {
            var emails = draft.InvitedEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
            foreach (var email in emails)
            {
                if (string.IsNullOrEmpty(email)) continue;
                _db.EventInvites.Add(new EventInvite { EventId = ev.Id, InvitedEmail = email });
            }
            await _db.SaveChangesAsync();
        }

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == ev.Id).Select(i => i.InvitedEmail).ToListAsync()
            : new List<string>();

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
            ev.MainImageUrl,
            ev.GalleryUrls,
            ev.CreatedBy,
            ev.CreatedAt,
            new List<WishDto>(),
            ev.Visibility,
            true,
            invitedEmailsList
        ));
    }
}

public record CreateCheckoutRequest(int DraftId);
public record VerifySessionRequest(string SessionId);
public record ConfirmPaymentRequest(int DraftId);
