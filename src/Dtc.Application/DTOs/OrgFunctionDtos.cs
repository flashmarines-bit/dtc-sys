namespace Dtc.Application.DTOs;

public record OrgFunctionDto(
    Guid Id,
    string Code,
    string Name,
    string? Suffix,
    string? Description,
    int SortOrder,
    bool IsActive
);

public record OrgFunctionListResponse(
    int TotalCount,
    List<OrgFunctionDto> Functions
);

public record CreateOrgFunctionRequest(
    string Code,
    string Name,
    string? Suffix,
    string? Description,
    int SortOrder = 0
);

public record UpdateOrgFunctionRequest(
    string? Code,
    string? Name,
    string? Suffix,
    string? Description,
    int? SortOrder,
    bool? IsActive
);
