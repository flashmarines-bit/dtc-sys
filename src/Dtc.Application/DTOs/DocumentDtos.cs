namespace Dtc.Application.DTOs;

using Dtc.Domain.Enums;

public record DocumentDto(
    Guid Id,
    string DocumentNumber,
    string? QrCode,
    string Title,
    string? Description,
    DocumentStatus Status,
    string? OriginalFileName,
    string? MimeType,
    long? FileSizeBytes,
    StorageStage StorageStage,
    Guid DocumentTypeId,
    string DocumentTypeCode,
    string DocumentTypeName,
    Guid? OrganizationFunctionId,
    string? OrganizationFunctionCode,
    string? OrganizationFunctionName,
    Guid CreatedByUserId,
    string CreatedByUserName,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record DocumentListResponse(
    int TotalCount,
    int Page,
    int PageSize,
    List<DocumentDto> Documents
);

public record CreateDocumentRequest(
    string Title,
    string? Description,
    Guid DocumentTypeId,
    Guid? OrganizationFunctionId,
    string? Department,
    string? DynamicData  // JSON string dari dynamic form fields
);

public record UpdateDocumentRequest(
    string? Title,
    string? Description,
    DocumentStatus? Status
);

public record DocumentVersionDto(
    Guid Id,
    int VersionNumber,
    string? Notes,
    string? StoragePath,
    Guid CreatedByUserId,
    string CreatedByUserName,
    DateTime CreatedAt
);
