namespace LifeEventsHub.Api.DTOs;

public record UserProfileDto(
    int Id,
    string Email,
    string DisplayName,
    string? Bio,
    string? ProfileImageUrl,
    string ProfileVisibility,
    bool ShowEmail,
    DateTime CreatedAt
);

public record UpdateProfileDto(
    string? DisplayName,
    string? Bio,
    string? ProfileImageUrl
);

public record UpdatePrivacyDto(
    string? ProfileVisibility, // Public, Private, FriendsOnly
    bool? ShowEmail
);
