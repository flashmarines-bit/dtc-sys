namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class DocumentService : IDocumentService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;

    public DocumentService(DtcDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<DocumentListResponse> GetAllAsync(int page = 1, int pageSize = 20, string? search = null, Guid? documentTypeId = null)
    {
        var query = _db.Set<Document>()
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .AsQueryable();

        if (documentTypeId.HasValue)
            query = query.Where(d => d.DocumentTypeId == documentTypeId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(d =>
                d.Title.ToLower().Contains(s) ||
                d.DocumentNumber.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => MapToDto(d))
            .ToListAsync();

        return new DocumentListResponse(totalCount, page, pageSize, items);
    }

    public async Task<DocumentDto?> GetByIdAsync(Guid id)
    {
        var doc = await _db.Set<Document>()
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doc is null || doc.IsDeleted) return null;
        return MapToDto(doc);
    }

    public async Task<DocumentDto> CreateAsync(CreateDocumentRequest request, Guid userId)
    {
        var docType = await _db.Set<DocumentType>().FindAsync(request.DocumentTypeId)
            ?? throw new ArgumentException("Document type not found.");

        var documentNumber = await GenerateDocumentNumber(docType, request.Department);

        var doc = new Document
        {
            Id = Guid.NewGuid(),
            DocumentNumber = documentNumber,
            Title = request.Title,
            Description = request.Description,
            Status = DocumentStatus.Draft,
            StorageStage = StorageStage.Temp,
            DocumentTypeId = request.DocumentTypeId,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Set<Document>().Add(doc);

        // Add tracking log
        _db.Set<DocumentTracking>().Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = doc.Id,
            Event = "Created",
            Notes = $"Document created with number {documentNumber}",
            ActedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Reload with includes
        return (await GetByIdAsync(doc.Id))!;
    }

    public async Task<DocumentDto?> UpdateAsync(Guid id, UpdateDocumentRequest request)
    {
        var doc = await _db.Set<Document>()
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doc is null || doc.IsDeleted) return null;

        if (request.Title is not null)
            doc.Title = request.Title;

        if (request.Description is not null)
            doc.Description = request.Description;

        if (request.Status.HasValue)
            doc.Status = request.Status.Value;

        doc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(doc);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var doc = await _db.Set<Document>().FindAsync(id);
        if (doc is null || doc.IsDeleted) return false;

        doc.IsDeleted = true;
        doc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<DocumentDto> UploadFileAsync(Guid documentId, Stream fileStream, string fileName, string contentType, Guid userId)
    {
        var doc = await _db.Set<Document>()
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new ArgumentException("Document not found.");

        var storagePath = $"documents/{doc.DocumentNumber}/{Guid.NewGuid()}_{fileName}";
        await _storage.UploadAsync(storagePath, fileStream, contentType);

        doc.StoragePath = storagePath;
        doc.OriginalFileName = fileName;
        doc.MimeType = contentType;
        doc.FileSizeBytes = fileStream.CanSeek ? fileStream.Length : null;
        doc.StorageStage = StorageStage.Temp;
        doc.UpdatedAt = DateTime.UtcNow;

        // Create version 1
        _db.Set<DocumentVersion>().Add(new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            VersionNumber = 1,
            StoragePath = storagePath,
            Notes = "Initial upload",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        // Tracking
        _db.Set<DocumentTracking>().Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            Event = "FileUploaded",
            Notes = $"File uploaded: {fileName}",
            ActedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return MapToDto(doc);
    }

    public async Task<(Stream stream, string fileName, string contentType)?> DownloadFileAsync(Guid documentId)
    {
        var doc = await _db.Set<Document>().FindAsync(documentId);
        if (doc is null || doc.StoragePath is null) return null;

        var stream = await _storage.DownloadAsync(doc.StoragePath);
        return (stream, doc.OriginalFileName ?? "download", doc.MimeType ?? "application/octet-stream");
    }

    public async Task<List<DocumentVersionDto>> GetVersionsAsync(Guid documentId)
    {
        return await _db.Set<DocumentVersion>()
            .Include(v => v.CreatedByUser)
            .Where(v => v.DocumentId == documentId && !v.IsDeleted)
            .OrderByDescending(v => v.VersionNumber)
            .Select(v => new DocumentVersionDto(
                v.Id, v.VersionNumber, v.Notes, v.StoragePath,
                v.CreatedByUserId, v.CreatedByUser.FullName,
                v.CreatedAt))
            .ToListAsync();
    }

    public async Task<DocumentVersionDto> UploadNewVersionAsync(
        Guid documentId, Stream fileStream, string fileName, string contentType, string? notes, Guid userId)
    {
        var doc = await _db.Set<Document>()
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new ArgumentException("Document not found.");

        var lastVersion = await _db.Set<DocumentVersion>()
            .Where(v => v.DocumentId == documentId && !v.IsDeleted)
            .MaxAsync(v => (int?)v.VersionNumber) ?? 0;

        var newVersionNumber = lastVersion + 1;
        var storagePath = $"documents/{doc.DocumentNumber}/v{newVersionNumber}_{fileName}";

        await _storage.UploadAsync(storagePath, fileStream, contentType);

        // Update document main file
        doc.StoragePath = storagePath;
        doc.OriginalFileName = fileName;
        doc.MimeType = contentType;
        doc.FileSizeBytes = fileStream.CanSeek ? fileStream.Length : null;
        doc.UpdatedAt = DateTime.UtcNow;

        var version = new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            VersionNumber = newVersionNumber,
            StoragePath = storagePath,
            Notes = notes,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Set<DocumentVersion>().Add(version);

        _db.Set<DocumentTracking>().Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            Event = "NewVersion",
            Notes = $"Version {newVersionNumber} uploaded: {fileName}",
            ActedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId);
        return new DocumentVersionDto(
            version.Id, version.VersionNumber, version.Notes, version.StoragePath,
            userId, user?.FullName ?? "", version.CreatedAt);
    }

    // --- Auto Numbering ---
    private async Task<string> GenerateDocumentNumber(DocumentType docType, string? department)
    {
        var year = DateTime.UtcNow.Year;

        var record = await _db.Set<NumberingRecord>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.DocumentTypeId == docType.Id &&
                r.Year == year &&
                r.Department == (department ?? ""));

        if (record is null)
        {
            record = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = docType.Id,
                Year = year,
                Department = department ?? "",
                LastSequence = 0,
                CreatedAt = DateTime.UtcNow
            };
            _db.Set<NumberingRecord>().Add(record);
        }

        record.LastSequence++;
        record.UpdatedAt = DateTime.UtcNow;

        var seq = record.LastSequence.ToString().PadLeft(docType.SequencePadding, '0');

        var number = docType.NumberingFormat
            .Replace("{YEAR}", year.ToString())
            .Replace("{DEPT}", department ?? "GEN")
            .Replace("{SEQ}", seq);

        return number;
    }

    private static DocumentDto MapToDto(Document d) => new(
        d.Id, d.DocumentNumber, d.Title, d.Description,
        d.Status, d.OriginalFileName, d.MimeType, d.FileSizeBytes,
        d.StorageStage, d.DocumentTypeId,
        d.DocumentType.Code, d.DocumentType.Name,
        d.CreatedByUserId, d.CreatedByUser.FullName,
        d.CreatedAt, d.UpdatedAt
    );
}
