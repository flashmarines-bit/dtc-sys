namespace Dtc.Application.DTOs;

using Dtc.Domain.Enums;

// Response untuk tracking log item
public record TrackingLogDto(
    Guid Id,
    TrackingEvent Event,
    string EventLabel,
    DocumentStatus? FromStatus,
    DocumentStatus? ToStatus,
    string? Notes,
    Guid? ActedByUserId,
    string? ActedByUserName,
    Guid? RecipientUserId,
    string? RecipientUserName,
    bool HasPhotoProof,
    bool OtpConfirmed,
    DateTime CreatedAt
);

// Response scan QR — info dokumen + available actions
public record QrScanResultDto(
    Guid DocumentId,
    string DocumentNumber,
    string QrCode,
    string Title,
    string? VendorName,
    string? ReferenceNumber,
    DocumentStatus Status,
    string StatusLabel,
    string? AssignedToUserName,
    DateTime? ReceivedAt,
    DateTime? AssignedAt,
    List<string> AvailableActions,
    List<TrackingLogDto> RecentHistory
);

// Request: Front desk receive document
public record ReceiveDocumentRequest(
    string? Notes
);

// Request: Assign ke verifier
public record AssignDocumentRequest(
    Guid VerifierUserId,
    string? Notes
);

// Request: Return document
public record ReturnDocumentRequest(
    string Reason
);

// Request: Initiate handover (generate OTP)
public record InitiateHandoverRequest(
    Guid RecipientUserId
);

// Request: Confirm handover (masukkan OTP)
public record ConfirmHandoverRequest(
    string OtpCode
);

// Response OTP initiation
public record HandoverInitiatedDto(
    Guid TrackingId,
    string OtpCode,
    DateTime ExpiresAt
);

// Dashboard metrics
public record TrackingDashboardDto(
    int ReceivedToday,
    int PendingAssignment,
    int UnderReview,
    int ReturnedDocuments,
    int ApprovedToday,
    int SlaOverdue
);

// SLA overdue item
public record SlaOverdueDto(
    Guid DocumentId,
    string DocumentNumber,
    string Title,
    string? VendorName,
    DocumentStatus CurrentStatus,
    string StatusLabel,
    DateTime StuckSince,
    int MinutesOverdue,
    int MaxAllowedMinutes
);
