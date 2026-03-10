using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;
    private readonly FileStorageService _fileStorage;

    public UsersController(AppDbContext db, JwtService jwt, FileStorageService fileStorage)
    {
        _db = db;
        _jwt = jwt;
        _fileStorage = fileStorage;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return NotFound();

        return Ok(ToProfile(user));
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromForm] string? displayName, [FromForm] string? bio, [FromForm] IFormFile? profileImage)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(displayName)) user.DisplayName = displayName.Trim();
        if (bio != null) user.Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();

        if (profileImage != null)
        {
            var url = await _fileStorage.SaveFileAsync(profileImage);
            if (url != null)
            {
                var baseUrl = _fileStorage.GetBaseUrl(Request);
                user.ProfileImageUrl = baseUrl + url;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(ToProfile(user));
    }

    [HttpPut("me/privacy")]
    public async Task<ActionResult<UserProfileDto>> UpdatePrivacy([FromBody] UpdatePrivacyDto dto)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return NotFound();

        if (dto.ProfileVisibility != null && new[] { "Public", "Private", "FriendsOnly" }.Contains(dto.ProfileVisibility))
            user.ProfileVisibility = dto.ProfileVisibility;
        if (dto.ShowEmail.HasValue)
            user.ShowEmail = dto.ShowEmail.Value;

        await _db.SaveChangesAsync();
        return Ok(ToProfile(user));
    }

    [HttpPut("me/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest("Current password is incorrect.");

        if (dto.NewPassword.Length < 6)
            return BadRequest("New password must be at least 6 characters.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static UserProfileDto ToProfile(User u) => new(
        u.Id, u.Email, u.DisplayName, u.Bio, u.ProfileImageUrl,
        u.ProfileVisibility, u.ShowEmail, u.CreatedAt);
}

public record ChangePasswordDto(string CurrentPassword, string NewPassword);
