namespace Dtc.Infrastructure.Jobs;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class AnalysisJob
{
    private readonly DtcDbContext _db;
    private readonly IOcrService _ocr;
    private readonly IStorageService _storage;
    private readonly IEmailService _email;
    private readonly ILogger<AnalysisJob> _logger;

    public AnalysisJob(DtcDbContext db, IOcrService ocr, IStorageService storage,
        IEmailService email, ILogger<AnalysisJob> logger)
    {
        _db = db;
        _ocr = ocr;
        _storage = storage;
        _email = email;
        _logger = logger;
    }

    public async Task ProcessAsync(Guid submissionId)
    {
        _logger.LogInformation("Starting analysis for submission {Id}", submissionId);

        var submission = await _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Include(s => s.DocumentType)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission is null)
        {
            _logger.LogWarning("Submission {Id} not found", submissionId);
            return;
        }

        try
        {
            submission.Status = VendorSubmissionStatus.Analysing;
            submission.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Download PDF dari Supabase
            _logger.LogInformation("Downloading PDF: {Path}", submission.OriginalStoragePath);
            var pdfStream = await _storage.DownloadAsync(submission.OriginalStoragePath);

            // Kirim ke OCR service
            var result = await _ocr.AnalyzeAsync(pdfStream, submission.FileName);

            if (!result.Success)
            {
                submission.Status = VendorSubmissionStatus.Rejected;
                submission.AiGrade = AiGrade.Invalid;
                submission.AiSummary = result.ErrorMessage ?? "Analysis failed";
                submission.AnalysisCompleted = true;
                submission.AnalysisCompletedAt = DateTime.UtcNow;
                submission.AnalysisErrorMessage = result.ErrorMessage;
                submission.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await _email.SendVendorRejectedAsync(
                    submission.VendorContactEmail,
                    submission.VendorContactName,
                    "Analisis dokumen gagal. Silakan upload ulang.",
                    "KualitasScanTidakMemadai"
                );
                return;
            }

            // Upload searchable PDF ke Supabase
            if (!string.IsNullOrEmpty(result.SearchablePdfBase64))
            {
                var searchableBytes = Convert.FromBase64String(result.SearchablePdfBase64);
                var searchablePath = submission.OriginalStoragePath.Replace("original.pdf", "searchable.pdf");
                using var searchableStream = new MemoryStream(searchableBytes);
                await _storage.UploadAsync(searchablePath, searchableStream, "application/pdf");
                submission.SearchablePdfPath = searchablePath;
            }

            // Update analysis results
            submission.DetectedDocumentType = result.DocumentType;
            submission.ExtractedFieldsJson = result.ExtractedFieldsJson;
            submission.DetectedSignatoryName = result.DetectedSignatory;
            submission.AiGrade = result.Grade switch
            {
                "Complete"   => AiGrade.Complete,
                "Incomplete" => AiGrade.Incomplete,
                _            => AiGrade.Invalid
            };
            submission.AiScore = result.AiScore;
            submission.AiSummary = result.AiSummary;
            submission.PageCount = result.TotalPages;
            submission.DetectedDpi = result.DetectedDpi;
            submission.DpiCheckResult = result.DpiPass ? DpiCheckResult.Pass : DpiCheckResult.TooLow;
            submission.AnalysisCompleted = true;
            submission.AnalysisCompletedAt = DateTime.UtcNow;
            submission.Status = VendorSubmissionStatus.UnderReview;
            submission.UpdatedAt = DateTime.UtcNow;

            // Match signatory ke SignatoryConfig
            if (!string.IsNullOrEmpty(result.DetectedSignatory))
            {
                var signatories = await _db.SignatoryConfigs
                    .Where(sc => sc.IsActive && sc.DocumentTypeId == submission.DocumentTypeId)
                    .ToListAsync();

                foreach (var sig in signatories)
                {
                    var allNames = new List<string> { sig.SignatoryName };
                    if (!string.IsNullOrEmpty(sig.NameAliases))
                        allNames.AddRange(sig.NameAliases.Split('|'));

                    var detected = result.DetectedSignatory.ToLower();
                    if (allNames.Any(n => detected.Contains(n.ToLower()) || n.ToLower().Contains(detected)))
                    {
                        submission.SignatoryConfigId = sig.Id;
                        _logger.LogInformation("Matched signatory: {Name} → {Config}", result.DetectedSignatory, sig.SignatoryName);
                        break;
                    }
                }
            }

            await _db.SaveChangesAsync();

            // Notifikasi validator
            _logger.LogInformation("Submission {Id} ready for review. Score: {Score}", submissionId, result.AiScore);
            await _email.SendValidatorNotificationAsync(
                "validator@company.com",  // TODO: get from config
                submissionId.ToString(),
                submission.VendorCompanyName,
                $"/validator/review/{submissionId}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Analysis failed for submission {Id}", submissionId);
            submission.Status = VendorSubmissionStatus.Pending;
            submission.AnalysisErrorMessage = ex.Message;
            submission.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            throw; // Hangfire will retry
        }
    }

    // Cleanup job — jalankan setiap hari
    public async Task CleanupExpiredAsync()
    {
        var expired = await _db.PendingVendorRequests
            .Where(s => s.ExpiresAt < DateTime.UtcNow
                     && s.Status != VendorSubmissionStatus.Accepted)
            .ToListAsync();

        foreach (var s in expired)
        {
            // Hapus file dari storage
            if (!string.IsNullOrEmpty(s.OriginalStoragePath))
            {
                try { await _storage.DeleteAsync(s.OriginalStoragePath); } catch { }
            }
            if (!string.IsNullOrEmpty(s.SearchablePdfPath))
            {
                try { await _storage.DeleteAsync(s.SearchablePdfPath); } catch { }
            }

            s.IsDeleted = true;
            s.UpdatedAt = DateTime.UtcNow;
        }

        if (expired.Any())
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} expired submissions", expired.Count);
        }
    }
}
