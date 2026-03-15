namespace Dtc.Domain.Enums;

public enum NotificationChannel
{
    Email = 0,
    InApp = 1,
    Push = 2,
    WhatsApp = 3
}

public enum NotificationPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3
}

public enum NotificationStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2,
    Read = 3
}

public enum NotificationType
{
    // Module 1 - Physical Tracking
    DocumentSubmitted = 100,
    PreArrivalDeclared = 101,
    DocumentReceivedFrontDesk = 102,
    DocumentReceivedVerifikator = 103,
    DualConfirmationRequired = 104,
    DualConfirmationComplete = 105,
    DropOffPhotoUploaded = 106,
    DropOffAcknowledgementRequired = 107,
    OtpPickupGenerated = 108,
    DocumentReturnedToVendor = 109,
    DocumentCompleted = 110,
    TakeOverNotification = 111,

    // SLA & Alarm
    SlaWarning = 200,
    SlaBreach = 201,
    PreArrivalTimeout = 202,
    DropOffUnacknowledged = 203,
    DocumentFloating = 204,
    OtpExpired = 205,
    EscalationToManager = 206,

    // Module 2 - Library
    LibraryProposed = 300,
    LibraryReviewRequested = 301,
    LibraryApproved = 302,
    LibraryRejected = 303,
    DocumentExpiringSoon = 304,

    // Module 3 - Vendor Request
    VendorSubmissionReceived = 400,
    AnalysisComplete = 401,
    VendorApproved = 402,
    VendorRejected = 403,
    VendorReturnedForRevision = 404,

    // System
    BackupSuccess = 500,
    BackupFailed = 501,
    SystemAlert = 502
}
