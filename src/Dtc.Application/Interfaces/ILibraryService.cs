namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface ILibraryService
{
    // ── BROWSE ────────────────────────────────────────────────
    Task<LibraryListResponse> GetAllAsync(
        int page = 1, int pageSize = 20,
        string? search = null,
        Guid? documentTypeId = null,
        string? category = null,
        string? tag = null,
        bool approvedOnly = false,
        string? userRole = null,      // untuk filter AllowedRoles
        string? contractNumber = null // untuk filter by contract
    );

    Task<LibraryDocumentDto?> GetByIdAsync(Guid id, string? userRole = null);

    // ── CREATE & PROPOSE ─────────────────────────────────────
    Task<LibraryDocumentDto> CreateAsync(
        CreateLibraryDocumentRequest request, Guid userId);

    Task<LibraryDocumentDto> ProposeAsync(
        ProposeToLibraryRequest request, Guid userId);

    // ── WORKFLOW ──────────────────────────────────────────────
    Task<LibraryDocumentDto> StartReviewAsync(
        Guid id, Guid userId, string? notes = null);

    Task<LibraryDocumentDto> ReviewAsync(
        Guid id, Guid userId, ReviewLibraryDocumentRequest request);

    Task<LibraryDocumentDto> ArchiveAsync(
        Guid id, Guid userId, string? notes = null);

    // ── FILE MANAGEMENT ───────────────────────────────────────
    Task<LibraryDocumentDto> UploadFileAsync(
        Guid id, Stream stream, string fileName,
        string contentType, string? notes, Guid userId);

    Task<(Stream stream, string fileName, string contentType)?> DownloadFileAsync(
        Guid id, string? userRole = null);

    Task<List<LibraryVersionDto>> GetVersionsAsync(Guid id);

    // ── TAGS & ACCESS ─────────────────────────────────────────
    Task<LibraryDocumentDto?> UpdateTagsAsync(
        Guid id, UpdateLibraryTagsRequest request, Guid userId);

    Task<LibraryDocumentDto?> UpdateAccessAsync(
        Guid id, UpdateLibraryAccessRequest request, Guid userId);

    // ── DEPENDENCY GRAPH ─────────────────────────────────────
    Task<DocumentDependencyDto?> GetDependencyGraphAsync(Guid id);

    Task<List<LibraryDocumentDto>> GetByContractNumberAsync(string contractNumber);

    // ── EXPIRY MONITORING ────────────────────────────────────
    Task<List<LibraryDocumentDto>> GetExpiringDocumentsAsync(int daysAhead = 30);

    // ── SEARCH ───────────────────────────────────────────────
    Task<LibraryListResponse> SearchByMetadataAsync(
        string query, int page = 1, int pageSize = 20, string? userRole = null);
}
