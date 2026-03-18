namespace Dtc.Application.DTOs;

public record DocumentTypeDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    string NumberingFormat,
    int SequencePadding,
    bool IsActive,
    string? ApplicableModules,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record DocumentTypeListResponse(
    int TotalCount,
    int Page,
    int PageSize,
    List<DocumentTypeDto> DocumentTypes
);

public record CreateDocumentTypeRequest(
    string Name,
    string Code,
    string? Description,
    string NumberingFormat,
    int SequencePadding = 5
);

public record UpdateDocumentTypeRequest(
    string? Name,
    string? Code,
    string? Description,
    string? NumberingFormat,
    int? SequencePadding,
    bool? IsActive,
    string? ApplicableModules
);
