namespace Dtc.Application.DTOs;

using Dtc.Domain.Enums;

public record LibraryDocumentDto(
    Guid Id,
    string DocumentNumber,
    string? QrCode,
    string Title,
    string? Description,
    string? Tags,
    string? Category,
    LibraryStatus LibraryStatus,
    string LibraryStatusLabel,
    DocumentStatus Status,
    string? OriginalFileName,
    string? MimeType,
    long? FileSizeBytes,
    Guid DocumentTypeId,
    string DocumentTypeCode,
    string DocumentTypeName,
    Guid? OrganizationFunctionId,
    string? OrganizationFunctionName,
    Guid CreatedByUserId,
    string CreatedByUserName,
    Guid? ReviewedByUserId,
    string? ReviewedByUserName,
    DateTime? ApprovedAt,
    string? RejectionReason,
    int VersionCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? ContentExpiresAt,
    string? ContractNumber,
    bool IsConfidential,
    string? AllowedRoles
);

public record LibraryListResponse(
    int TotalCount,
    int Page,
    int PageSize,
    List<LibraryDocumentDto> Documents
);

public record ProposeToLibraryRequest(
    Guid DocumentId,
    string? Tags,
    string? Category,
    string? Notes
);

public record CreateLibraryDocumentRequest(
    string Title,
    string? Description,
    Guid DocumentTypeId,
    Guid? OrganizationFunctionId,
    string? Tags,
    string? Category,
    string? Department
);

public record ReviewLibraryDocumentRequest(
    bool Approve,
    string? Notes,
    string? RejectionReason
);

public record UpdateLibraryTagsRequest(
    string? Tags,
    string? Category
);

public record LibraryVersionDto(
    Guid Id,
    int VersionNumber,
    string? Notes,
    string? StoragePath,
    string? FileName,
    Guid CreatedByUserId,
    string CreatedByUserName,
    DateTime CreatedAt
);

// ── TAMBAHAN ────────────────────────────────────────────────

public record UpdateLibraryAccessRequest(
    string? AllowedRoles,     // comma-separated: "Admin,Validator"
    bool IsConfidential,
    DateTime? ContentExpiresAt
);

public record DocumentDependencyDto(
    Guid Id,
    string DocumentNumber,
    string Title,
    string? ContractNumber,
    string DocumentTypeName,
    string StatusLabel,
    DateTime CreatedAt,
    List<DocumentDependencyDto> Children
);
