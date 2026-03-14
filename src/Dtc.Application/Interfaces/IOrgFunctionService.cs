namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IOrgFunctionService
{
    Task<OrgFunctionListResponse> GetAllAsync(string? search = null);
    Task<OrgFunctionDto?> GetByIdAsync(Guid id);
    Task<OrgFunctionDto> CreateAsync(CreateOrgFunctionRequest request);
    Task<OrgFunctionDto?> UpdateAsync(Guid id, UpdateOrgFunctionRequest request);
    Task<bool> DeleteAsync(Guid id);
}
