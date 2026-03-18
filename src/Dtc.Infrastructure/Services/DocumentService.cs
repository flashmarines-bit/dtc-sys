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
    private readonly IQrCodeService _qrCode;

    private static readonly string[] RomanMonths =
        ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

    public DocumentService(DtcDbContext db, IStorageService storage, IQrCodeService qrCode)
    {
        _db = db;
        _storage = storage;
        _qrCode = qrCode;
    }

    public async Task<DocumentListResponse> GetAllAsync(int page = 1, int pageSize = 20, string? search = null, Guid? documentTypeId = null)
    {
        var query = _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
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
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doc is null || doc.IsDeleted) return null;
        return MapToDto(doc);
    }

    public async Task<DocumentDto> CreateAsync(CreateDocumentRequest request, Guid userId)
    {
        var docType = await _db.DocumentTypes.FindAsync(request.DocumentTypeId)
            ?? throw new ArgumentException("Document type not found.");

        OrganizationFunction? orgFunction = null;
        if (request.OrganizationFunctionId.HasValue)
        {
            orgFunction = await _db.OrganizationFunctions.FindAsync(request.OrganizationFunctionId.Value)
                ?? throw new ArgumentException("Organization function not found.");
        }

        var documentNumber = await GenerateDocumentNumber(docType, orgFunction, request.Department);

        // Generate QR code value + upload PNG to storage
        var year = DateTime.UtcNow.Year;
        var qrSeq = await GetNextQrSequenceAsync(year);
        var qrValue = _qrCode.GenerateQrCodeValue(year, qrSeq);

        var docId = Guid.NewGuid();
        var qrPngBytes = _qrCode.GenerateQrPng(qrValue);
        var qrStoragePath = $"qr-codes/{docId}.png";
        using var qrStream = new System.IO.MemoryStream(qrPngBytes);
        await _storage.UploadAsync(qrStoragePath, qrStream, "image/png");

        var doc = new Document
        {
            Id = docId,
            DocumentNumber = documentNumber,
            QrCode = qrValue,
            Title = request.Title,
            Description = request.Description,
            Status = DocumentStatus.Draft,
            StorageStage = StorageStage.Temp,
            DocumentTypeId = request.DocumentTypeId,
            OrganizationFunctionId = request.OrganizationFunctionId,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            DynamicData = request.DynamicData
        };

        _db.Documents.Add(doc);

        _db.DocumentTrackings.Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = doc.Id,
            Event = TrackingEvent.Created,
            Notes = $"Document created: {documentNumber}",
            ActedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return (await GetByIdAsync(doc.Id))!;
    }

    public async Task<DocumentDto?> UpdateAsync(Guid id, UpdateDocumentRequest request)
    {
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doc is null || doc.IsDeleted) return null;

        if (request.Title is not null) doc.Title = request.Title;
        if (request.Description is not null) doc.Description = request.Description;
        if (request.Status.HasValue) doc.Status = request.Status.Value;

        doc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(doc);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc is null || doc.IsDeleted) return false;

        doc.IsDeleted = true;
        doc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<DocumentDto> UploadFileAsync(Guid documentId, Stream fileStream, string fileName, string contentType, Guid userId)
    {
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
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

        _db.DocumentVersions.Add(new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            VersionNumber = 1,
            StoragePath = storagePath,
            Notes = "Initial upload",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        _db.DocumentTrackings.Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            Event = TrackingEvent.FileUploaded,
            Notes = $"File uploaded: {fileName}",
            ActedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return MapToDto(doc);
    }

    public async Task<(Stream stream, string fileName, string contentType)?> DownloadFileAsync(Guid documentId)
    {
        var doc = await _db.Documents.FindAsync(documentId);
        if (doc is null || doc.StoragePath is null) return null;

        var stream = await _storage.DownloadAsync(doc.StoragePath);
        return (stream, doc.OriginalFileName ?? "download", doc.MimeType ?? "application/octet-stream");
    }

    public async Task<List<DocumentVersionDto>> GetVersionsAsync(Guid documentId)
    {
        return await _db.DocumentVersions
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
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new ArgumentException("Document not found.");

        var lastVersion = await _db.DocumentVersions
            .Where(v => v.DocumentId == documentId && !v.IsDeleted)
            .MaxAsync(v => (int?)v.VersionNumber) ?? 0;

        var newVersionNumber = lastVersion + 1;
        var storagePath = $"documents/{doc.DocumentNumber}/v{newVersionNumber}_{fileName}";

        await _storage.UploadAsync(storagePath, fileStream, contentType);

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
            CreatedAt = DateTime.UtcNow,
        };

        _db.DocumentVersions.Add(version);

        _db.DocumentTrackings.Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            Event = TrackingEvent.NewVersion,
            Notes = $"Version {newVersionNumber}: {fileName}",
            ActedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId);
        return new DocumentVersionDto(
            version.Id, version.VersionNumber, version.Notes, version.StoragePath,
            userId, user?.FullName ?? "", version.CreatedAt);
    }

    // ==================== FLEXIBLE NUMBERING ENGINE ====================
    // Supported placeholders:
    //   {SEQ}         → auto-increment sequence (padded)
    //   {TYPE}        → document type code (SP3, INV, etc.)
    //   {FUNGSI}      → organization function code (PHR14410, etc.)
    //   {SUFFIX}      → organization function suffix (S0, S8, etc.)
    //   {YEAR}        → 4-digit year (2026)
    //   {YY}          → 2-digit year (26)
    //   {MONTH}       → 2-digit month (01-12)
    //   {MONTH_ROMAN} → Roman numeral month (I-XII)
    //   {DEPT}        → department code
    //   {DAY}         → 2-digit day (01-31)
    //
    // Example formats:
    //   "{SEQ}/{TYPE}/{FUNGSI}/{YEAR}-{SUFFIX}"   → 0022/SP3/PHR14410/2026-S0
    //   "{TYPE}-{YEAR}-{FUNGSI}-{SEQ}"            → SP3-2026-PHR14410-0022
    //   "{YEAR}.{MONTH}.{SEQ}/{TYPE}"             → 2026.03.0001/MEMO
    //   "{FUNGSI}/{TYPE}/{YEAR}/{SEQ}-{SUFFIX}"   → PHR14410/SP3/2026/0022-S0

    private async Task<string> GenerateDocumentNumber(
        DocumentType docType, OrganizationFunction? orgFunction, string? department)
    {
        var now = DateTime.UtcNow;
        var year = now.Year;

        // Sequence is per: DocumentType + Year + Function (if any) + Department (if any)
        var record = await _db.NumberingRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.DocumentTypeId == docType.Id &&
                r.Year == year &&
                r.OrganizationFunctionId == (orgFunction != null ? orgFunction.Id : null) &&
                r.Department == (department ?? ""));

        if (record is null)
        {
            record = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = docType.Id,
                OrganizationFunctionId = orgFunction?.Id,
                Year = year,
                Department = department ?? "",
                LastSequence = 0,
                ScopeKey = $"{docType.Code}_{year}_{orgFunction?.Code ?? "GEN"}_{department ?? ""}",
                CreatedAt = DateTime.UtcNow
            };
            _db.NumberingRecords.Add(record);
        }

        record.LastSequence++;
        record.UpdatedAt = DateTime.UtcNow;

        var seq = record.LastSequence.ToString().PadLeft(docType.SequencePadding, '0');

        var number = docType.NumberingFormat
            .Replace("{SEQ}", seq)
            .Replace("{TYPE}", docType.Code)
            .Replace("{FUNGSI}", orgFunction?.Code ?? "")
            .Replace("{SUFFIX}", orgFunction?.Suffix ?? "")
            .Replace("{YEAR}", year.ToString())
            .Replace("{YY}", (year % 100).ToString("D2"))
            .Replace("{MONTH}", now.Month.ToString("D2"))
            .Replace("{MONTH_ROMAN}", RomanMonths[now.Month])
            .Replace("{DEPT}", department ?? "GEN")
            .Replace("{DAY}", now.Day.ToString("D2"));

        return number;
    }


    // QR sequence — global per year (terpisah dari document numbering)
    private async Task<int> GetNextQrSequenceAsync(int year)
    {
        // Reuse NumberingRecord dengan ScopeKey khusus QR
        const string qrScope = "__QR__";
        var record = await _db.NumberingRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.ScopeKey == qrScope &&
                r.Year == year);

        if (record is null)
        {
            record = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = (await _db.DocumentTypes.FirstAsync()).Id, // placeholder FK
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

    private static DocumentDto MapToDto(Document d) => new(
        d.Id, d.DocumentNumber, d.QrCode, d.Title, d.Description,
        d.Status, d.OriginalFileName, d.MimeType, d.FileSizeBytes,
        d.StorageStage, d.DocumentTypeId,
        d.DocumentType.Code, d.DocumentType.Name,
        d.OrganizationFunctionId,
        d.OrganizationFunction?.Code,
        d.OrganizationFunction?.Name,
        d.CreatedByUserId, d.CreatedByUser.FullName,
        d.CreatedAt, d.UpdatedAt
    );
}
