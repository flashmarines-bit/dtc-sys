namespace Dtc.Domain.Entities;

using Dtc.Domain.Common;
using Dtc.Domain.Enums;

public class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationChannel Channel { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;

    // Target
    public Guid? UserId { get; set; }           // null = broadcast
    public string? UserEmail { get; set; }
    public string? UserPhone { get; set; }       // untuk WA

    // Context — link ke entity terkait
    public string? EntityType { get; set; }      // "Document", "PendingVendorRequest", dll
    public Guid? EntityId { get; set; }
    public string? ActionUrl { get; set; }       // deep link ke halaman terkait

    // Delivery
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; } = 0;
    public DateTime? NextRetryAt { get; set; }

    // Metadata
    public string? MetadataJson { get; set; }    // data tambahan dalam JSON

    // Relations
    public User? User { get; set; }
}
