namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;
using Hangfire;

public class VendorService : IVendorService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;
    private readonly IBackgroundJobClient _jobs;

    public VendorService(DtcDbContext db, IStorageService storage, IBackgroundJobClient jobs)
    {
        _db = db;
        _storage = storage;
        _jobs = jobs;
    }

    public async Task<VendorSubmissionDto> CreateSubmissionAsync(
        CreateVendorSubmissionRequest request, Guid vendorUserId)
    {
        var docType = await _db.DocumentTypes.FindAsync(request.DocumentTypeId)
            ?? throw new ArgumentException("Document type not found.");

        var submissionNumber = await GenerateSubmissionNumberAsync();

        var submission = new PendingVendorRequest
        {
            Id = Guid.NewGuid(),
            SubmissionNumber = submissionNumber,
            Title = request.Title,
            Description = request.Description,
            Status = VendorSubmissionStatus.Pending,
            VendorCompanyName = request.VendorCompanyName,
            VendorContactName = request.VendorContactName,
            VendorContactEmail = request.VendorContactEmail,
            VendorContactPhone = request.VendorContactPhone,
            ReferenceNumber = request.ReferenceNumber,
            DocumentDate = request.DocumentDate,
            DocumentValue = request.DocumentValue,
            Notes = request.Notes,
            DocumentTypeId = request.DocumentTypeId,
            VendorUserId = vendorUserId,
            OriginalStoragePath = "",  // akan diupdate saat file upload
            FileName = "",
            FileSizeBytes = 0,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _db.PendingVendorRequests.Add(submission);
        await _db.SaveChangesAsync();

        return (await GetSubmissionAsync(submission.Id, vendorUserId))!;
    }

    public async Task<VendorSubmissionDto?> GetSubmissionAsync(Guid id, Guid vendorUserId)
    {
        var s = await GetWithIncludes()
            .FirstOrDefaultAsync(s => s.Id == id && s.VendorUserId == vendorUserId);
        return s is null ? null : MapToDto(s);
    }

    public async Task<List<VendorSubmissionDto>> GetMySubmissionsAsync(Guid vendorUserId)
    {
        return await GetWithIncludes()
            .Where(s => s.VendorUserId == vendorUserId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    private IQueryable<PendingVendorRequest> GetWithIncludes() =>
        _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Include(s => s.DocumentType)
            .Include(s => s.ValidatorUser)
            .Include(s => s.SignatoryConfig)
            .Include(s => s.ResultDocument);

    private async Task<string> GenerateSubmissionNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.PendingVendorRequests
            .CountAsync(s => s.CreatedAt.Year == year);
        return $"REQ-{year}-{(count + 1):D5}";
    }

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
        null, null,  // URLs generated on demand
        s.ResultDocumentId, s.ResultDocument?.DocumentNumber,
        s.VendorUserId, s.VendorUser.FullName,
        s.ExpiresAt, s.CreatedAt, s.UpdatedAt
    );
}
