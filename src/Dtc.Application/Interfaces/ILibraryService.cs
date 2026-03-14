namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface ILibraryService
{
    // Browse library
    Task<LibraryListResponse> GetAllAsync(int page = 1, int pageSize = 20,
        string? search = null, Guid? documentTypeId = null,
        string? category = null, string? tag = null,
        bool approvedOnly = false);
    Task<LibraryDocumentDto?> GetByIdAsync(Guid id);

    // Create directly as library document
    Task<LibraryDocumentDto> CreateAsync(CreateLibraryDocumentRequest request, Guid userId);

    // Propose existing document to library
    Task<LibraryDocumentDto> ProposeAsync(ProposeToLibraryRequest request, Guid userId);

    // Workflow
    Task<LibraryDocumentDto> StartReviewAsync(Guid id, Guid userId, string? notes = null);
    Task<LibraryDocumentDto> ReviewAsync(Guid id, Guid userId, ReviewLibraryDocumentRequest request);
    Task<LibraryDocumentDto> ArchiveAsync(Guid id, Guid userId, string? notes = null);

    // File management
    Task<LibraryDocumentDto> UploadFileAsync(Guid id, Stream stream, string fileName, string contentType, string? notes, Guid userId);
    Task<(Stream stream, string fileName, string contentType)?> DownloadFileAsync(Guid id);
    Task<List<LibraryVersionDto>> GetVersionsAsync(Guid id);

    // Tags
    Task<LibraryDocumentDto?> UpdateTagsAsync(Guid id, UpdateLibraryTagsRequest request, Guid userId);
}
