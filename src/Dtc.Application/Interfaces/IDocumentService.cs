namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IDocumentService
{
    Task<DocumentListResponse> GetAllAsync(int page = 1, int pageSize = 20, string? search = null, Guid? documentTypeId = null);
    Task<DocumentDto?> GetByIdAsync(Guid id);
    Task<DocumentDto> CreateAsync(CreateDocumentRequest request, Guid userId);
    Task<DocumentDto?> UpdateAsync(Guid id, UpdateDocumentRequest request);
    Task<bool> DeleteAsync(Guid id);

    // File operations
    Task<DocumentDto> UploadFileAsync(Guid documentId, Stream fileStream, string fileName, string contentType, Guid userId);
    Task<(Stream stream, string fileName, string contentType)?> DownloadFileAsync(Guid documentId);

    // Versions
    Task<List<DocumentVersionDto>> GetVersionsAsync(Guid documentId);
    Task<DocumentVersionDto> UploadNewVersionAsync(Guid documentId, Stream fileStream, string fileName, string contentType, string? notes, Guid userId);
}
