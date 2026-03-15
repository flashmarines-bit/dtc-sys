using Dtc.Domain.Common;
using Dtc.Domain.Enums;

namespace Dtc.Domain.Entities;

public class DocumentTracking : BaseEntity
{
    public TrackingEvent Event { get; set; }
    public DocumentStatus? FromStatus { get; set; }
    public DocumentStatus? ToStatus { get; set; }
    public string? Notes { get; set; }
    public string? IpAddress { get; set; }

    // Handover OTP
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiresAt { get; set; }
    public DateTime? OtpConfirmedAt { get; set; }

    // Photo proof (drop-off when recipient absent)
    public string? PhotoProofPath { get; set; }

    // Who received (for handover tracking)
    public Guid? RecipientUserId { get; set; }
    public User? RecipientUser { get; set; }

    // Extended tracking fields
    public string? ActionContext { get; set; }   // JSON context data
    public string? PhotoPath { get; set; }       // Foto untuk event ini
    public bool RequiresAck { get; set; } = false; // Perlu konfirmasi pihak lain?
    public bool IsAcknowledged { get; set; } = false;
    public DateTime? AcknowledgedAt { get; set; }
    public Guid? AcknowledgedByUserId { get; set; }
    public User? AcknowledgedByUser { get; set; }

    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;

    public Guid? ActedByUserId { get; set; }
    public User? ActedByUser { get; set; }
}

public class NumberingRecord : BaseEntity
{
    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public Guid? OrganizationFunctionId { get; set; }
    public OrganizationFunction? OrganizationFunction { get; set; }

    public int Year { get; set; }
    public string ScopeKey { get; set; } = default!;
    public string? Department { get; set; }
    public int LastSequence { get; set; } = 0;
}

public class SlaConfiguration : BaseEntity
{
    public DocumentStatus FromStatus { get; set; }
    public DocumentStatus ToStatus { get; set; }
    public int MaxDurationMinutes { get; set; }
    public Guid? DocumentTypeId { get; set; }           // null = berlaku semua tipe
    public DocumentType? DocumentType { get; set; }
    public string? Description { get; set; }
}
