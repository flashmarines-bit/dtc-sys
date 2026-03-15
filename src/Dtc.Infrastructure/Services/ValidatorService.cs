namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class ValidatorService : IValidatorService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;
    private readonly IEmailService _email;
    private readonly ILibraryService _library;

    public ValidatorService(DtcDbContext db, IStorageService storage,
        IEmailService email, ILibraryService library)
    {
        _db = db;
        _storage = storage;
        _email = email;
        _library = library;
    }

    public async Task<List<VendorSubmissionDto>> GetQueueAsync()
    {
        return await GetWithIncludes()
            .Where(s => s.Status == VendorSubmissionStatus.UnderReview)
            .OrderBy(s => s.CreatedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<VendorSubmissionDto?> GetDetailAsync(Guid id)
    {
        var s = await GetWithIncludes().FirstOrDefaultAsync(s => s.Id == id);
        return s is null ? null : MapToDto(s);
    }

    public async Task<VendorSubmissionDto> ApproveAsync(Guid id, Guid validatorUserId, string? notes)
    {
        var submission = await GetWithIncludes().FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ArgumentException("Submission not found.");

        if (submission.Status != VendorSubmissionStatus.UnderReview)
            throw new InvalidOperationException("Submission is not under review.");

        // Find signatory config
        var signatoryConfig = submission.SignatoryConfigId.HasValue
            ? await _db.SignatoryConfigs
                .Include(sc => sc.DocumentType)
                .Include(sc => sc.OrganizationFunction)
                .FirstOrDefaultAsync(sc => sc.Id == submission.SignatoryConfigId)
            : null;

        // Generate document number
        var docNumber = await GenerateDocumentNumberAsync(submission, signatoryConfig);

        // Move PDF from temporary to permanent storage
        var permanentPath = $"permanent/{DateTime.UtcNow:yyyy/MM}/{docNumber.Replace("/", "_")}/original.pdf";
        var searchablePath = $"permanent/{DateTime.UtcNow:yyyy/MM}/{docNumber.Replace("/", "_")}/searchable.pdf";

        if (!string.IsNullOrEmpty(submission.OriginalStoragePath))
        {
            var originalStream = await _storage.DownloadAsync(submission.OriginalStoragePath);
            await _storage.UploadAsync(permanentPath, originalStream, "application/pdf");
        }

        if (!string.IsNullOrEmpty(submission.SearchablePdfPath))
        {
            var searchableStream = await _storage.DownloadAsync(submission.SearchablePdfPath);
            await _storage.UploadAsync(searchablePath, searchableStream, "application/pdf");
        }

        // Create library document
        var docType = await _db.DocumentTypes.FindAsync(submission.DocumentTypeId)!;
        var orgFuncId = signatoryConfig?.OrganizationFunctionId;

        var libDoc = new Document
        {
            Id = Guid.NewGuid(),
            DocumentNumber = docNumber,
            Title = submission.Title,
            Description = submission.Description,
            Status = DocumentStatus.Approved,
            StoragePath = searchablePath,
            OriginalFileName = submission.FileName,
            MimeType = "application/pdf",
            FileSizeBytes = submission.FileSizeBytes,
            StorageStage = StorageStage.Archive,
            IsLibraryDocument = true,
            LibraryStatus = LibraryStatus.Approved,
            LibraryApprovedAt = DateTime.UtcNow,
            LibraryReviewedByUserId = validatorUserId,
            DocumentTypeId = submission.DocumentTypeId,
            OrganizationFunctionId = orgFuncId,
            CreatedByUserId = submission.VendorUserId,
            Tags = submission.DetectedDocumentType,
            CreatedAt = DateTime.UtcNow
        };

        _db.Documents.Add(libDoc);

        // Update submission
        submission.Status = VendorSubmissionStatus.Accepted;
        submission.ValidatorUserId = validatorUserId;
        submission.ValidatorNotes = notes;
        submission.ValidatedAt = DateTime.UtcNow;
        submission.ResultDocumentId = libDoc.Id;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Send email notification
        await _email.SendVendorApprovedAsync(
            submission.VendorContactEmail,
            submission.VendorContactName,
            docNumber,
            searchablePath
        );

        return MapToDto(submission);
    }

    public async Task<VendorSubmissionDto> RejectAsync(Guid id, Guid validatorUserId, RejectSubmissionRequest request)
    {
        var submission = await GetWithIncludes().FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ArgumentException("Submission not found.");

        if (submission.Status != VendorSubmissionStatus.UnderReview)
            throw new InvalidOperationException("Submission is not under review.");

        var category = Enum.TryParse<RejectionCategory>(request.RejectionCategory, out var cat)
            ? cat : RejectionCategory.Lainnya;

        submission.Status = VendorSubmissionStatus.Rejected;
        submission.ValidatorUserId = validatorUserId;
        submission.RejectionCategory = category;
        submission.RejectionReason = request.RejectionReason;
        submission.ValidatorNotes = request.ValidatorNotes;
        submission.ValidatedAt = DateTime.UtcNow;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _email.SendVendorRejectedAsync(
            submission.VendorContactEmail,
            submission.VendorContactName,
            request.RejectionReason,
            category.ToString()
        );

        return MapToDto(submission);
    }

    private async Task<string> GenerateDocumentNumberAsync(
        PendingVendorRequest submission, SignatoryConfig? config)
    {
        if (config is null)
        {
            var year = DateTime.UtcNow.Year;
            var count = await _db.PendingVendorRequests
                .CountAsync(s => s.Status == VendorSubmissionStatus.Accepted && s.CreatedAt.Year == year);
            return $"DOC-{year}-{(count + 1):D5}";
        }

        var docType = config.DocumentType;
        var orgFunc = config.OrganizationFunction;
        var now = DateTime.UtcNow;
        string[] roman = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

        // Get next sequence for this signatory
        var seqRecord = await _db.NumberingRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.DocumentTypeId == config.DocumentTypeId &&
                r.OrganizationFunctionId == config.OrganizationFunctionId &&
                r.Year == now.Year);

        if (seqRecord is null)
        {
            seqRecord = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = config.DocumentTypeId,
                OrganizationFunctionId = config.OrganizationFunctionId,
                ScopeKey = $"{docType.Code}_{now.Year}_{orgFunc.Code}",
                Year = now.Year,
                LastSequence = 0,
                CreatedAt = now
            };
            _db.NumberingRecords.Add(seqRecord);
        }

        seqRecord.LastSequence++;
        seqRecord.UpdatedAt = now;

        var seq = seqRecord.LastSequence.ToString().PadLeft(config.SequencePadding, '0');

        return config.NumberingFormat
            .Replace("{SEQ}", seq)
            .Replace("{TYPE}", docType.Code)
            .Replace("{FUNGSI}", orgFunc.Code)
            .Replace("{SUFFIX}", orgFunc.Suffix ?? "")
            .Replace("{YEAR}", now.Year.ToString())
            .Replace("{YY}", (now.Year % 100).ToString("D2"))
            .Replace("{MONTH}", now.Month.ToString("D2"))
            .Replace("{MONTH_ROMAN}", roman[now.Month])
            .Replace("{DAY}", now.Day.ToString("D2"));
    }

    private IQueryable<PendingVendorRequest> GetWithIncludes() =>
        _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Include(s => s.DocumentType)
            .Include(s => s.ValidatorUser)
            .Include(s => s.SignatoryConfig)
                .ThenInclude(sc => sc!.DocumentType)
            .Include(s => s.SignatoryConfig)
                .ThenInclude(sc => sc!.OrganizationFunction)
            .Include(s => s.ResultDocument);

    private static VendorSubmissionDto MapToDto(PendingVendorRequest s) => new(
        s.Id, s.SubmissionNumber, s.Title, s.Description,
        s.Status, s.Status.ToString(),
        s.VendorCompanyName, s.VendorContactName, s.VendorContactEmail,
        s.ReferenceNumber, s.DocumentDate, s.DocumentValue,
        s.FileName, s.FileSizeBytes, s.PageCount,
        s.DetectedDpi, s.DpiCheckResult == DpiCheckResult.Pass,
        s.DetectedDocumentType, s.ExtractedFieldsJson,
        s.DetectedSignatoryName, s.AiGrade.ToString(),
        s.AiScore, s.AiSummary, s.AnalysisCompleted,
        s.RejectionCategory?.ToString(), s.RejectionReason,
        s.ValidatorNotes, s.ValidatedAt,
        null, null,
        s.ResultDocumentId, s.ResultDocument?.DocumentNumber,
        s.VendorUserId, s.VendorUser.FullName,
        s.ExpiresAt, s.CreatedAt, s.UpdatedAt
    );
}
