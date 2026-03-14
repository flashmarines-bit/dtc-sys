namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IDocumentTypeService
{
    Task<DocumentTypeListResponse> GetAllAsync(int page = 1, int pageSize = 20, string? search = null);
    Task<DocumentTypeDto?> GetByIdAsync(Guid id);
    Task<DocumentTypeDto> CreateAsync(CreateDocumentTypeRequest request);
    Task<DocumentTypeDto?> UpdateAsync(Guid id, UpdateDocumentTypeRequest request);
    Task<bool> DeleteAsync(Guid id);
}
