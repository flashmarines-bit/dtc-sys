using Dtc.Domain.Common;
using Dtc.Domain.Enums;

namespace Dtc.Domain.Entities;

public class Document : BaseEntity
{
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;

    // Physical tracking (Module 1)
    public string? QrCode { get; set; }                     // DTC-TRK-2026-000001
    public string? VendorName { get; set; }
    public string? ReferenceNumber { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? ReviewStartedAt { get; set; }
    public string? ReturnReason { get; set; }

    // Module 1 — Extended Physical Tracking
    public DateTime? PreArrivalDeclaredAt { get; set; }  // Kapan vendor declare mau antar
    public DateTime? FrontDeskReceivedAt { get; set; }   // Kapan front desk terima
    public DateTime? VerifikatorReceivedAt { get; set; } // Kapan verifikator terima (SLA start)
    public DateTime? DropOffAt { get; set; }             // Kapan dititip di meja
    public DateTime? DropOffAcknowledgedAt { get; set; } // Kapan target konfirmasi titipan
    public DateTime? ReturnInitiatedAt { get; set; }     // Kapan return diinisiasi
    public DateTime? ReturnCompletedAt { get; set; }     // Kapan fisik diserahkan ke vendor

    // SLA tracking
    public Guid? CurrentHolderId { get; set; }           // Siapa yang pegang sekarang
    public User? CurrentHolder { get; set; }
    public DateTime? SlaStartedAt { get; set; }          // Kapan SLA mulai (= VerifikatorReceivedAt)
    public DateTime? SlaDeadlineAt { get; set; }         // Kapan SLA harus selesai
    public bool SlaBreached { get; set; } = false;
    public bool EscalationSent { get; set; } = false;

    // OTP untuk pickup kurir
    public string? PickupOtpCode { get; set; }
    public DateTime? PickupOtpExpiresAt { get; set; }
    public DateTime? PickupOtpVerifiedAt { get; set; }
    public Guid? PickupVerifiedByUserId { get; set; }    // Verifikator yang verify OTP

    // Drop-off photo
    public string? DropOffPhotoPath { get; set; }        // Path foto bukti drop-off
    public Guid? DropOffByUserId { get; set; }           // Siapa yang drop-off (Santi)
    public User? DropOffByUser { get; set; }

    // Vendor contact (untuk Module 1)
    public string? VendorContactEmail { get; set; }
    public string? VendorContactPhone { get; set; }
    public string? VendorPicName { get; set; }           // Nama PIC vendor

    // Team/Department target
    public string? TargetDepartment { get; set; }        // Dept tujuan dokumen

    // Storage
    public string? StoragePath { get; set; }
    public StorageStage StorageStage { get; set; } = StorageStage.Temp;
    public string? OriginalFileName { get; set; }
    public string? MimeType { get; set; }
    public long? FileSizeBytes { get; set; }

    /// <summary>
    /// Dynamic metadata — JSONB untuk field yang bervariasi per DocumentType.
    /// Diisi berdasarkan MetaSchema dari DocumentType.
    /// Example: {"NomorInvoice":"INV-001","NilaiInvoice":50000000,"LokasiPekerjaan":"Site A"}
    /// </summary>
    public string? DynamicData { get; set; }

    // Relations
    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public Guid? OrganizationFunctionId { get; set; }
    public OrganizationFunction? OrganizationFunction { get; set; }

    // Library (Module 2)
    public bool IsLibraryDocument { get; set; } = false;
    public LibraryStatus LibraryStatus { get; set; } = LibraryStatus.None;
    public string? Tags { get; set; }                   // comma-separated tags
    public string? Category { get; set; }
    public Guid? LibraryReviewedByUserId { get; set; }
    public User? LibraryReviewedByUser { get; set; }
    public DateTime? LibraryApprovedAt { get; set; }
    public string? LibraryRejectionReason { get; set; }

    // Navigation
    public ICollection<DocumentVersion> Versions { get; set; } = [];
    public ICollection<WorkflowInstance> WorkflowInstances { get; set; } = [];
    public ICollection<DocumentTracking> TrackingLogs { get; set; } = [];
}
