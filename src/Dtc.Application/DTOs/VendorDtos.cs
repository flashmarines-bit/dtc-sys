namespace Dtc.Application.DTOs;

using Dtc.Domain.Enums;

public record VendorSubmissionDto(
    Guid Id,
    string SubmissionNumber,
    string Title,
    string? Description,
    VendorSubmissionStatus Status,
    string StatusLabel,
    // Form fields
    string VendorCompanyName,
    string VendorContactName,
    string VendorContactEmail,
    string? ReferenceNumber,
    DateTime? DocumentDate,
    decimal? DocumentValue,
    // File info
    string FileName,
    long FileSizeBytes,
    int PageCount,
    int? DetectedDpi,
    bool DpiPass,
    // AI Analysis
    string? DetectedDocumentType,
    string? ExtractedFieldsJson,
    string? DetectedSignatoryName,
    string? AiGradeLabel,
    int? AiScore,
    string? AiSummary,
    bool AnalysisCompleted,
    // Validator
    string? RejectionCategoryLabel,
    string? RejectionReason,
    string? ValidatorNotes,
    DateTime? ValidatedAt,
    // Storage
    string? OriginalPdfUrl,
    string? SearchablePdfUrl,
    // Result
    Guid? ResultDocumentId,
    string? ResultDocumentNumber,
    // Meta
    Guid VendorUserId,
    string VendorUserName,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateVendorSubmissionRequest(
    string Title,
    string? Description,
    Guid DocumentTypeId,
    string VendorCompanyName,
    string VendorContactName,
    string VendorContactEmail,
    string VendorContactPhone,
    string? ReferenceNumber,
    DateTime? DocumentDate,
    decimal? DocumentValue,
    string? Notes
);

public record RejectSubmissionRequest(
    string RejectionCategory,
    string RejectionReason,
    string? ValidatorNotes
);

public record ValidatorQueueItemDto(
    Guid Id,
    string SubmissionNumber,
    string Title,
    string VendorCompanyName,
    string VendorContactName,
    string? DetectedDocumentType,
    int? AiScore,
    string? AiGradeLabel,
    bool AnalysisCompleted,
    DateTime CreatedAt,
    DateTime ExpiresAt
);
