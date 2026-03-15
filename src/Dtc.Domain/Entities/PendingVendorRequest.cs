using Dtc.Domain.Common;
using Dtc.Domain.Enums;

namespace Dtc.Domain.Entities;

public class PendingVendorRequest : BaseEntity
{
    // Identitas submission
    public string SubmissionNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public VendorSubmissionStatus Status { get; set; } = VendorSubmissionStatus.Pending;

    // Form fields vendor
    public string VendorCompanyName { get; set; } = string.Empty;
    public string VendorContactName { get; set; } = string.Empty;
    public string VendorContactEmail { get; set; } = string.Empty;
    public string VendorContactPhone { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public DateTime? DocumentDate { get; set; }
    public decimal? DocumentValue { get; set; }
    public string? Notes { get; set; }

    // File info
    public string OriginalStoragePath { get; set; } = string.Empty;
    public string? SearchablePdfPath { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public int PageCount { get; set; }
    public DpiCheckResult DpiCheckResult { get; set; } = DpiCheckResult.Unknown;
    public int? DetectedDpi { get; set; }

    // AI Analysis result
    public string? DetectedDocumentType { get; set; }
    public string? ExtractedText { get; set; }
    public string? ExtractedFieldsJson { get; set; }    // JSON fields per tipe
    public string? DetectedSignatoryName { get; set; }
    public AiGrade AiGrade { get; set; } = AiGrade.Pending;
    public int? AiScore { get; set; }                   // 1-10
    public string? AiSummary { get; set; }
    public bool AnalysisCompleted { get; set; } = false;
    public DateTime? AnalysisCompletedAt { get; set; }
    public string? AnalysisErrorMessage { get; set; }

    // Validator decision
    public RejectionCategory? RejectionCategory { get; set; }
    public string? RejectionReason { get; set; }
    public string? ValidatorNotes { get; set; }
    public DateTime? ValidatedAt { get; set; }

    // Expiry (30 hari untuk temporary)
    public DateTime ExpiresAt { get; set; }

    // Return for revision
    public string? ReturnNotes { get; set; }
    public DateTime? ReturnedAt { get; set; }

    // Re-submission tracking
    public int ResubmissionCount { get; set; } = 0;
    public int MaxResubmissions { get; set; } = 3;
    public Guid? ParentSubmissionId { get; set; }
    public PendingVendorRequest? ParentSubmission { get; set; }

    // Relations
    public Guid VendorUserId { get; set; }
    public User VendorUser { get; set; } = null!;

    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public Guid? ValidatorUserId { get; set; }
    public User? ValidatorUser { get; set; }

    public Guid? SignatoryConfigId { get; set; }
    public SignatoryConfig? SignatoryConfig { get; set; }

    public Guid? ResultDocumentId { get; set; }
    public Document? ResultDocument { get; set; }
}
