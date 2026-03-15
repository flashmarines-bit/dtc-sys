namespace Dtc.Domain.Enums;

public enum DocumentStatus
{
    // ── INITIAL ──────────────────────────────────
    Draft = 0,              // Baru dibuat, belum submit

    // ── VENDOR SIDE ──────────────────────────────
    Submitted = 1,          // Vendor submit, menunggu antar fisik
    PreArrivalDeclared = 2, // Vendor deklarasi "Saya sedang mengantar"

    // ── FRONT DESK / LOBI ────────────────────────
    ReceivedAtFrontDesk = 3,    // Diterima front desk/satpam
    InTransitInternal = 4,      // Dalam perjalanan ke verifikator

    // ── VERIFIKATOR SIDE ─────────────────────────
    PendingDualConfirmation = 5, // Menunggu konfirmasi dual (verif + vendor)
    ReceivedByVerifikator = 6,   // Diterima verifikator, SLA mulai
    DroppedOffPendingAck = 7,    // Dititip di meja, menunggu konfirmasi
    InReview = 8,                // Sedang direview

    // ── RETURN FLOW ──────────────────────────────
    ReturnInitiated = 9,         // Verifikator inisiasi pengembalian
    WaitingPickupConfirmation = 10, // Menunggu kurir/vendor ambil (OTP)
    ReturnedToVendor = 11,       // Dikembalikan ke vendor

    // ── TERMINAL STATES ──────────────────────────
    Approved = 12,          // Disetujui
    Rejected = 13,          // Ditolak
    Archived = 14,          // Diarsipkan

    // ── MODULE 2 LIBRARY ─────────────────────────
    LibraryProposed = 20,   // Diusulkan masuk library
    LibraryUnderReview = 21,
    LibraryApproved = 22,
    LibraryRejected = 23,
    LibraryArchived = 24
}

public enum TrackingEvent
{
    // Basic
    Created = 0,
    Submitted = 1,
    Archived = 8,
    FileUploaded = 12,
    NewVersion = 13,

    // Module 1 — Physical Tracking
    PreArrivalDeclared = 20,        // Vendor: saya sedang mengantar
    ReceivedAtFrontDesk = 21,       // Front desk terima
    ForwardedToTeam = 22,           // Front desk teruskan ke tim
    DualConfirmationVendor = 23,    // Vendor konfirmasi serah terima
    DualConfirmationVerif = 24,     // Verifikator konfirmasi serah terima
    TakeOver = 25,                  // Staf ambil alih dari kolega
    DropOffInitiated = 26,          // Titip di meja (Santi → Budi)
    DropOffPhotoUploaded = 27,      // Foto bukti drop-off diupload
    DropOffAcknowledged = 28,       // Target konfirmasi terima titipan
    ReviewStarted = 29,             // Mulai review
    ReturnInitiated = 30,           // Verifikator inisiasi return
    OtpGenerated = 31,              // OTP pickup dibuat
    OtpVerified = 32,               // OTP diverifikasi kurir
    ReturnedToVendor = 33,          // Fisik diserahkan ke vendor/kurir
    Approved = 34,
    Rejected = 35,

    // SLA & Alarm
    SlaWarningTriggered = 40,
    SlaBreachTriggered = 41,
    EscalationTriggered = 42,
    PreArrivalTimeout = 43,
    DropOffUnacknowledgedAlert = 44,

    // Module 2 — Library
    LibraryProposed = 50,
    LibraryReviewStarted = 51,
    LibraryApproved = 52,
    LibraryRejected = 53,

    // Module 3 — Vendor Request
    VendorRequestSubmitted = 60,
    AnalysisStarted = 61,
    AnalysisCompleted = 62,
    AutoRejectedByAI = 63,
    ValidatorApproved = 64,
    ValidatorRejected = 65,
    NumberIssued = 66
}

public enum WorkflowActionType
{
    Approve = 0,
    Reject = 1,
    RequestRevision = 2
}

public enum StorageStage
{
    Temp = 0,
    Quarantine = 1,
    Archive = 2
}

public enum LibraryStatus
{
    None = 0,           // bukan library document
    Proposed = 1,       // diusulkan masuk library
    UnderReview = 2,    // sedang direview
    Approved = 3,       // disetujui, masuk library
    Archived = 4,       // diarsipkan
    Rejected = 5        // ditolak
}

public enum LibraryTrackingEvent
{
    Proposed = 0,
    ReviewStarted = 1,
    Approved = 2,
    Archived = 3,
    Rejected = 4,
    FileUploaded = 5,
    NewVersion = 6,
    TagsUpdated = 7
}

public enum RejectionCategory
{
    KualitasScanTidakMemadai = 0,
    DokumenTidakLengkap = 1,
    Lainnya = 2
}

public enum DpiCheckResult
{
    Pass = 0,       // >= 300 DPI
    TooLow = 1,     // < 300 DPI
    Unknown = 2     // tidak bisa detect
}

public enum VendorSubmissionStatus
{
    Pending = 0,
    Analysing = 1,
    UnderReview = 2,
    Accepted = 3,
    Rejected = 4,
    ReturnedForRevision = 5
}

public enum AiGrade
{
    Pending = 0,
    Complete = 1,
    Incomplete = 2,
    Invalid = 3
}
