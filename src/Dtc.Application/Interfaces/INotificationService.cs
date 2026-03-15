namespace Dtc.Application.Interfaces;

using Dtc.Domain.Enums;

public record NotificationRequest
{
    public required string Title { get; init; }
    public required string Message { get; init; }
    public required NotificationType Type { get; init; }
    public NotificationPriority Priority { get; init; } = NotificationPriority.Normal;

    // Target — bisa kombinasi
    public Guid? UserId { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }          // untuk WA
    public List<Guid>? BroadcastUserIds { get; init; }  // broadcast ke banyak user

    // Context
    public string? EntityType { get; init; }
    public Guid? EntityId { get; init; }
    public string? ActionUrl { get; init; }
    public string? MetadataJson { get; init; }

    // Channel override — null = gunakan semua channel aktif
    public List<NotificationChannel>? Channels { get; init; }
}

public record NotificationResult
{
    public bool Success { get; init; }
    public Dictionary<NotificationChannel, bool> ChannelResults { get; init; } = new();
    public string? ErrorMessage { get; init; }
}

public interface INotificationService
{
    /// <summary>Kirim notifikasi ke satu user</summary>
    Task<NotificationResult> SendAsync(NotificationRequest request);

    /// <summary>Broadcast ke list user IDs</summary>
    Task<NotificationResult> BroadcastAsync(
        List<Guid> userIds, NotificationRequest request);

    /// <summary>Broadcast ke semua user dengan role tertentu</summary>
    Task<NotificationResult> BroadcastToRoleAsync(
        string role, NotificationRequest request);

    /// <summary>Ambil notifikasi InApp untuk user (bell icon)</summary>
    Task<List<InAppNotificationDto>> GetInAppAsync(
        Guid userId, int page = 1, int pageSize = 20);

    /// <summary>Tandai notifikasi sebagai sudah dibaca</summary>
    Task MarkAsReadAsync(Guid notificationId, Guid userId);

    /// <summary>Tandai semua notifikasi user sebagai dibaca</summary>
    Task MarkAllAsReadAsync(Guid userId);

    /// <summary>Hitung unread notifications</summary>
    Task<int> GetUnreadCountAsync(Guid userId);
}

public record InAppNotificationDto(
    Guid Id,
    string Title,
    string Message,
    NotificationType Type,
    NotificationPriority Priority,
    string? EntityType,
    Guid? EntityId,
    string? ActionUrl,
    bool IsRead,
    DateTime CreatedAt
);
