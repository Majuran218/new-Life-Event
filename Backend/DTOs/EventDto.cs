namespace LifeEventsHub.Api.DTOs;

public record EventListDto(
    int Id,
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    DateTime? BirthDate,
    DateTime? DeathDate,
    DateTime? WeddingDate,
    string? Location,
    string? Country,
    string? MainImageUrl,
    string CreatedBy,
    DateTime CreatedAt,
    int WishCount,
    string Visibility
);

public record EventDetailDto(
    int Id,
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    DateTime? BirthDate,
    DateTime? DeathDate,
    DateTime? WeddingDate,
    string? Location,
    string? Country,
    string? MainImageUrl,
    string? GalleryUrls,
    string CreatedBy,
    DateTime CreatedAt,
    List<WishDto> Wishes,
    string Visibility,
    bool IsOwner = false,
    List<string>? InvitedEmails = null
);

public record EventInviteDto(int Id, string InvitedEmail, DateTime CreatedAt);

public record CreateEventDto(
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    string? Location,
    string CreatedBy
);
