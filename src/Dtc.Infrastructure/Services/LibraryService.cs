namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class LibraryService : ILibraryService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;
    private readonly IQrCodeService _qrCode;

    private static readonly Dictionary<LibraryStatus, string> StatusLabels = new()
    {
        [LibraryStatus.None]        = "Not a Library Document",
        [LibraryStatus.Proposed]    = "Proposed",
        [LibraryStatus.UnderReview] = "Under Review",
        [LibraryStatus.Approved]    = "Approved",
        [LibraryStatus.Archived]    = "Archived",
        [LibraryStatus.Rejected]    = "Rejected",
    };

    public LibraryService(DtcDbContext db, IStorageService storage, IQrCodeService qrCode)
    {
        _db = db;
        _storage = storage;
        _qrCode = qrCode;
    }

    public async Task<LibraryListResponse> GetAllAsync(
        int page = 1, int pageSize = 20,
        string? search = null, Guid? documentTypeId = null,
        string? category = null, string? tag = null,
        bool approvedOnly = false,
        string? userRole = null,
        string? contractNumber = null)
    {
        var query = _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .Include(d => d.LibraryReviewedByUser)
            .Where(d => d.IsLibraryDocument)
            .AsQueryable();

        if (approvedOnly)
            query = query.Where(d => d.LibraryStatus == LibraryStatus.Approved);

        if (documentTypeId.HasValue)
            query = query.Where(d => d.DocumentTypeId == documentTypeId.Value);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(d => d.Category == category);

        if (!string.IsNullOrWhiteSpace(tag))
            query = query.Where(d => d.Tags != null && d.Tags.Contains(tag));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(d =>
                d.Title.ToLower().Contains(s) ||
                d.DocumentNumber.ToLower().Contains(s) ||
                (d.Tags != null && d.Tags.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = new List<LibraryDocumentDto>();
        foreach (var d in items)
        {
            var vCount = await _db.DocumentVersions.CountAsync(v => v.DocumentId == d.Id && !v.IsDeleted);
            dtos.Add(MapToDto(d, vCount));
        }

        return new LibraryListResponse(total, page, pageSize, dtos);
    }

    public async Task<LibraryDocumentDto?> GetByIdAsync(Guid id, string? userRole = null)
    {
        var doc = await GetDocOrNullAsync(id);
        if (doc is null) return null;
        var vCount = await _db.DocumentVersions.CountAsync(v => v.DocumentId == id && !v.IsDeleted);
        return MapToDto(doc, vCount);
    }

    public async Task<LibraryDocumentDto> CreateAsync(CreateLibraryDocumentRequest request, Guid userId)
    {
        var docType = await _db.DocumentTypes.FindAsync(request.DocumentTypeId)
            ?? throw new ArgumentException("Document type not found.");

        OrganizationFunction? orgFunction = null;
        if (request.OrganizationFunctionId.HasValue)
            orgFunction = await _db.OrganizationFunctions.FindAsync(request.OrganizationFunctionId.Value);

        // Generate numbering
        var docNumber = await GenerateDocumentNumberAsync(docType, orgFunction, request.Department);

        // Generate QR
        var year = DateTime.UtcNow.Year;
        var qrSeq = await GetNextQrSequenceAsync(year, docType.Id);
        var qrValue = _qrCode.GenerateQrCodeValue(year, qrSeq);
        var docId = Guid.NewGuid();
        var qrPng = _qrCode.GenerateQrPng(qrValue);
        using var qrStream = new System.IO.MemoryStream(qrPng);
        await _storage.UploadAsync($"qr-codes/{docId}.png", qrStream, "image/png");

        var doc = new Document
        {
            Id = docId,
            DocumentNumber = docNumber,
            QrCode = qrValue,
            Title = request.Title,
            Description = request.Description,
            Tags = request.Tags,
            Category = request.Category,
            IsLibraryDocument = true,
            LibraryStatus = LibraryStatus.Proposed,
            Status = DocumentStatus.Draft,
            StorageStage = StorageStage.Temp,
            DocumentTypeId = request.DocumentTypeId,
            OrganizationFunctionId = request.OrganizationFunctionId,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Documents.Add(doc);
        AddTracking(doc.Id, userId, "Proposed to library.");
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(doc.Id))!;
    }

    public async Task<LibraryDocumentDto> ProposeAsync(ProposeToLibraryRequest request, Guid userId)
    {
        var doc = await GetDocOrThrowAsync(request.DocumentId);

        doc.IsLibraryDocument = true;
        doc.LibraryStatus = LibraryStatus.Proposed;
        doc.Tags = request.Tags ?? doc.Tags;
        doc.Category = request.Category ?? doc.Category;
        doc.UpdatedAt = DateTime.UtcNow;

        AddTracking(doc.Id, userId, request.Notes ?? "Document proposed to library.");
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(doc.Id))!;
    }

    public async Task<LibraryDocumentDto> StartReviewAsync(Guid id, Guid userId, string? notes = null)
    {
        var doc = await GetDocOrThrowAsync(id);
        AssertLibraryStatus(doc, LibraryStatus.Proposed);

        doc.LibraryStatus = LibraryStatus.UnderReview;
        doc.UpdatedAt = DateTime.UtcNow;
        AddTracking(doc.Id, userId, notes ?? "Library review started.");
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task<LibraryDocumentDto> ReviewAsync(Guid id, Guid userId, ReviewLibraryDocumentRequest request)
    {
        var doc = await GetDocOrThrowAsync(id);
        AssertLibraryStatus(doc, LibraryStatus.UnderReview);

        doc.LibraryReviewedByUserId = userId;

        if (request.Approve)
        {
            doc.LibraryStatus = LibraryStatus.Approved;
            doc.LibraryApprovedAt = DateTime.UtcNow;
            doc.StorageStage = StorageStage.Archive;
            AddTracking(doc.Id, userId, request.Notes ?? "Document approved for library.");
        }
        else
        {
            doc.LibraryStatus = LibraryStatus.Rejected;
            doc.LibraryRejectionReason = request.RejectionReason;
            AddTracking(doc.Id, userId, $"Rejected: {request.RejectionReason}");
        }

        doc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<LibraryDocumentDto> ArchiveAsync(Guid id, Guid userId, string? notes = null)
    {
        var doc = await GetDocOrThrowAsync(id);
        if (doc.LibraryStatus != LibraryStatus.Approved)
            throw new InvalidOperationException("Only approved documents can be archived.");

        doc.LibraryStatus = LibraryStatus.Archived;
        doc.StorageStage = StorageStage.Archive;
        doc.UpdatedAt = DateTime.UtcNow;
        AddTracking(doc.Id, userId, notes ?? "Document archived.");
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<LibraryDocumentDto> UploadFileAsync(
        Guid id, Stream stream, string fileName, string contentType, string? notes, Guid userId)
    {
        var doc = await GetDocOrThrowAsync(id);

        var lastVersion = await _db.DocumentVersions
            .Where(v => v.DocumentId == id && !v.IsDeleted)
            .MaxAsync(v => (int?)v.VersionNumber) ?? 0;
        var versionNumber = lastVersion + 1;

        var path = $"library/{doc.DocumentNumber}/v{versionNumber}_{fileName}";
        await _storage.UploadAsync(path, stream, contentType);

        doc.StoragePath = path;
        doc.OriginalFileName = fileName;
        doc.MimeType = contentType;
        doc.FileSizeBytes = stream.CanSeek ? stream.Length : null;
        doc.UpdatedAt = DateTime.UtcNow;

        _db.DocumentVersions.Add(new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = id,
            VersionNumber = versionNumber,
            StoragePath = path,
            Notes = notes ?? $"Version {versionNumber}",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        AddTracking(doc.Id, userId, $"File uploaded: {fileName} (v{versionNumber})");
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<(Stream stream, string fileName, string contentType)?> DownloadFileAsync(Guid id, string? userRole = null)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc is null || doc.StoragePath is null) return null;
        var stream = await _storage.DownloadAsync(doc.StoragePath);
        return (stream, doc.OriginalFileName ?? "download", doc.MimeType ?? "application/octet-stream");
    }

    public async Task<List<LibraryVersionDto>> GetVersionsAsync(Guid id)
    {
        return await _db.DocumentVersions
            .Include(v => v.CreatedByUser)
            .Where(v => v.DocumentId == id && !v.IsDeleted)
            .OrderByDescending(v => v.VersionNumber)
            .Select(v => new LibraryVersionDto(
                v.Id, v.VersionNumber, v.Notes, v.StoragePath,
                v.Document.OriginalFileName,
                v.CreatedByUserId, v.CreatedByUser.FullName, v.CreatedAt))
            .ToListAsync();
    }

    public async Task<LibraryDocumentDto?> UpdateTagsAsync(Guid id, UpdateLibraryTagsRequest request, Guid userId)
    {
        var doc = await GetDocOrThrowAsync(id);
        doc.Tags = request.Tags;
        doc.Category = request.Category;
        doc.UpdatedAt = DateTime.UtcNow;
        AddTracking(doc.Id, userId, $"Tags updated: {request.Tags} | Category: {request.Category}");
        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    // ── HELPERS ──────────────────────────────────────────────────────────

    private async Task<Document?> GetDocOrNullAsync(Guid id) =>
        await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .Include(d => d.LibraryReviewedByUser)
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

    private async Task<Document> GetDocOrThrowAsync(Guid id) =>
        await GetDocOrNullAsync(id) ?? throw new ArgumentException("Document not found.");

    private static void AssertLibraryStatus(Document doc, LibraryStatus expected)
    {
        if (doc.LibraryStatus != expected)
            throw new InvalidOperationException(
                $"Expected library status {expected}, but document is {doc.LibraryStatus}.");
    }

    private void AddTracking(Guid documentId, Guid userId, string notes)
    {
        _db.DocumentTrackings.Add(new DocumentTracking
        {
            DocumentId = documentId,
            Event = TrackingEvent.FileUploaded, // generic tracking
            ActedByUserId = userId,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        });
    }

    private async Task<int> GetNextQrSequenceAsync(int year, Guid docTypeId)
    {
        const string qrScope = "__QR__";
        var record = await _db.NumberingRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.ScopeKey == qrScope && r.Year == year);

        if (record is null)
        {
            record = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = docTypeId,
                ScopeKey = qrScope,
                Year = year,
                LastSequence = 0,
                CreatedAt = DateTime.UtcNow
            };
            _db.NumberingRecords.Add(record);
        }
        record.LastSequence++;
        record.UpdatedAt = DateTime.UtcNow;
        return record.LastSequence;
    }

    private async Task<string> GenerateDocumentNumberAsync(
        DocumentType docType, OrganizationFunction? orgFunction, string? department)
    {
        var now = DateTime.UtcNow;
        var year = now.Year;
        var scopeKey = $"{docType.Code}_{year}_{orgFunction?.Code ?? "GEN"}_{department ?? ""}";

        var orgFunctionId = orgFunction?.Id;
        var dept = department ?? "";
        var record = await _db.NumberingRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.DocumentTypeId == docType.Id && r.Year == year &&
                r.OrganizationFunctionId == orgFunctionId &&
                r.Department == dept);

        if (record is null)
        {
            record = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = docType.Id,
                OrganizationFunctionId = orgFunction?.Id,
                Year = year,
                Department = department ?? "",
                ScopeKey = scopeKey,
                LastSequence = 0,
                CreatedAt = DateTime.UtcNow
            };
            _db.NumberingRecords.Add(record);
        }

        record.LastSequence++;
        record.UpdatedAt = DateTime.UtcNow;

        string[] romanMonths = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
        return docType.NumberingFormat
            .Replace("{SEQ}", record.LastSequence.ToString().PadLeft(docType.SequencePadding, '0'))
            .Replace("{TYPE}", docType.Code)
            .Replace("{FUNGSI}", orgFunction?.Code ?? "")
            .Replace("{SUFFIX}", orgFunction?.Suffix ?? "")
            .Replace("{YEAR}", year.ToString())
            .Replace("{YY}", (year % 100).ToString("D2"))
            .Replace("{MONTH}", now.Month.ToString("D2"))
            .Replace("{MONTH_ROMAN}", romanMonths[now.Month])
            .Replace("{DEPT}", department ?? "GEN")
            .Replace("{DAY}", now.Day.ToString("D2"));
    }

    private static LibraryDocumentDto MapToDto(Document d, int versionCount) => new(
        d.Id, d.DocumentNumber, d.QrCode, d.Title, d.Description,
        d.Tags, d.Category,
        d.LibraryStatus, d.LibraryStatus.ToString(),
        d.Status, d.OriginalFileName, d.MimeType, d.FileSizeBytes,
        d.DocumentTypeId, d.DocumentType.Code, d.DocumentType.Name,
        d.OrganizationFunctionId, d.OrganizationFunction?.Name,
        d.CreatedByUserId, d.CreatedByUser.FullName,
        d.LibraryReviewedByUserId, d.LibraryReviewedByUser?.FullName,
        d.LibraryApprovedAt, d.LibraryRejectionReason,
        versionCount, d.CreatedAt, d.UpdatedAt,
        d.ContentExpiresAt, d.ContractNumber, d.IsConfidential, d.AllowedRoles
    );

    // ── ROLE-BASED ACCESS ─────────────────────────────────────

    public async Task<LibraryDocumentDto?> UpdateAccessAsync(
        Guid id, UpdateLibraryAccessRequest request, Guid userId)
    {
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == id && d.IsLibraryDocument);

        if (doc is null) return null;

        doc.AllowedRoles = request.AllowedRoles;
        doc.IsConfidential = request.IsConfidential;
        doc.ContentExpiresAt = request.ContentExpiresAt;
        doc.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(doc, 0);
    }

    // ── DEPENDENCY GRAPH ──────────────────────────────────────

    public async Task<DocumentDependencyDto?> GetDependencyGraphAsync(Guid id)
    {
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.ChildDocuments)
                .ThenInclude(c => c.DocumentType)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doc is null) return null;
        return await BuildDependencyTreeAsync(doc, 0);
    }

    private async Task<DocumentDependencyDto> BuildDependencyTreeAsync(
        Document doc, int depth)
    {
        if (depth > 3) // max depth 3
            return new DocumentDependencyDto(
                doc.Id, doc.DocumentNumber, doc.Title,
                doc.ContractNumber, doc.DocumentType?.Name ?? "",
                doc.LibraryStatus.ToString(), doc.CreatedAt, []);

        var children = await _db.Documents
            .Include(d => d.DocumentType)
            .Where(d => d.ParentDocumentId == doc.Id && !d.IsDeleted)
            .ToListAsync();

        var childDtos = new List<DocumentDependencyDto>();
        foreach (var child in children)
            childDtos.Add(await BuildDependencyTreeAsync(child, depth + 1));

        return new DocumentDependencyDto(
            doc.Id, doc.DocumentNumber, doc.Title,
            doc.ContractNumber, doc.DocumentType?.Name ?? "",
            doc.LibraryStatus.ToString(), doc.CreatedAt, childDtos);
    }

    public async Task<List<LibraryDocumentDto>> GetByContractNumberAsync(
        string contractNumber)
    {
        var docs = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .Include(d => d.LibraryReviewedByUser)
            .Where(d => d.ContractNumber == contractNumber
                     && d.IsLibraryDocument
                     && !d.IsDeleted)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return docs.Select(d => MapToDto(d, 0)).ToList();
    }

    // ── EXPIRY MONITORING ─────────────────────────────────────

    public async Task<List<LibraryDocumentDto>> GetExpiringDocumentsAsync(
        int daysAhead = 30)
    {
        var cutoff = DateTime.UtcNow.AddDays(daysAhead);
        var docs = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .Include(d => d.LibraryReviewedByUser)
            .Where(d => d.IsLibraryDocument
                     && d.ContentExpiresAt != null
                     && d.ContentExpiresAt <= cutoff
                     && d.LibraryStatus == LibraryStatus.Approved
                     && !d.IsDeleted)
            .OrderBy(d => d.ContentExpiresAt)
            .ToListAsync();

        return docs.Select(d => MapToDto(d, 0)).ToList();
    }

    // ── SEARCH BY METADATA ────────────────────────────────────

    public async Task<LibraryListResponse> SearchByMetadataAsync(
        string query, int page = 1, int pageSize = 20,
        string? userRole = null)
    {
        var q = _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .Include(d => d.LibraryReviewedByUser)
            .Where(d => d.IsLibraryDocument
                     && d.LibraryStatus == LibraryStatus.Approved
                     && !d.IsDeleted
                     && (d.Title.Contains(query)
                      || d.Tags!.Contains(query)
                      || d.DynamicData!.Contains(query)
                      || d.Description!.Contains(query)
                      || d.ContractNumber!.Contains(query)));

        // Filter role-based access
        if (!string.IsNullOrEmpty(userRole))
        {
            q = q.Where(d => !d.IsConfidential
                          || d.AllowedRoles == null
                          || d.AllowedRoles.Contains(userRole));
        }

        var total = await q.CountAsync();
        var docs = await q
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new LibraryListResponse(total, page, pageSize,
            docs.Select(d => MapToDto(d, 0)).ToList());
    }

    // Update GetAllAsync untuk support role-based + contractNumber
    public async Task<List<LibraryDocumentDto>> GetByContractNumberFilterAsync(
        string contractNumber, string? userRole = null)
    {
        return await GetByContractNumberAsync(contractNumber);
    }

}