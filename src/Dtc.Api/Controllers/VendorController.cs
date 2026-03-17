using Dtc.Api.Middleware;
using Microsoft.AspNetCore.RateLimiting;
namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Jobs;
using Dtc.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/vendor")]
[Authorize]
public class VendorController : ControllerBase
{
    private readonly IVendorService _vendor;
    private readonly IStorageService _storage;
    private readonly IBackgroundJobClient _jobs;
    private readonly DtcDbContext _db;

    public VendorController(IVendorService vendor, IStorageService storage,
        IBackgroundJobClient jobs, DtcDbContext db)
    {
        _vendor = vendor;
        _storage = storage;
        _jobs = jobs;
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);

    [HttpPost("submissions")]
    public async Task<IActionResult> Create([FromBody] CreateVendorSubmissionRequest request)
    {
        try
        {
            var result = await _vendor.CreateSubmissionAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("submissions/{id:guid}/upload")]
    [EnableRateLimiting("upload")]
    public async Task<IActionResult> UploadPdf(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var minSize = 5L * 1024 * 1024; // 5MB minimum
        var maxSize = 100L * 1024 * 1024;

        if (file.Length < minSize)
            return BadRequest(new { error = $"File terlalu kecil. file Anda: {file.Length / 1024:F1}KB" });

        if (file.Length > maxSize)
            return BadRequest(new { error = $"File terlalu besar. Maximum 100MB." });

        // Validasi magic bytes — bukan hanya extension
        if (!await file.IsPdfAsync())
            return BadRequest(new { success = false, error = "File bukan PDF valid. Pastikan file adalah dokumen PDF asli.", statusCode = 400, timestamp = DateTime.UtcNow });

        var submission = await _db.PendingVendorRequests
            .FirstOrDefaultAsync(s => s.Id == id && s.VendorUserId == GetUserId());

        if (submission is null) return NotFound(new { error = "Submission not found." });

        // Allow re-submission if previously rejected
        if (submission.Status == VendorSubmissionStatus.Rejected)
        {
            submission.Status = VendorSubmissionStatus.Pending;
            submission.AiGrade = Dtc.Domain.Enums.AiGrade.Pending;
            submission.AnalysisCompleted = false;
            submission.RejectionReason = null;
            submission.RejectionCategory = null;
            submission.ValidatorNotes = null;
            submission.ValidatedAt = null;
            submission.ExpiresAt = DateTime.UtcNow.AddDays(30);
        }
        else if (submission.Status != VendorSubmissionStatus.Pending)
            return BadRequest(new { error = "Submission sudah diproses dan tidak bisa diubah." });

        var storagePath = $"vendor-submissions/temporary/{id}/original.pdf";
        using var stream = file.OpenReadStream();
        await _storage.UploadAsync(storagePath, stream, "application/pdf");

        var sha256 = await file.ComputeSha256Async();
        submission.OriginalStoragePath = storagePath;
        submission.FileName = file.FileName;
        submission.FileSizeBytes = file.Length;
        submission.Sha256Hash = sha256;
        submission.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var jobId = _jobs.Enqueue<AnalysisJob>(job => job.ProcessAsync(id));

        return Ok(new
        {
            message = "File uploaded. Analysis started in background.",
            submissionId = id,
            fileName = file.FileName,
            fileSizeMb = Math.Round(file.Length / 1024.0 / 1024.0, 4),
            jobId,
            estimatedProcessingMinutes = 15
        });
    }

    [HttpGet("submissions/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _vendor.GetSubmissionAsync(id, GetUserId());
        if (result is null) return NotFound(new { error = "Submission not found." });
        return Ok(result);
    }

    [HttpGet("submissions")]
    public async Task<IActionResult> GetMine()
        => Ok(await _vendor.GetMySubmissionsAsync(GetUserId()));

    /// <summary>Buat submission baru sebagai resubmission dari yang ditolak</summary>
    [HttpPost("submissions/{id:guid}/resubmit")]
    public async Task<IActionResult> Resubmit(Guid id, [FromBody] ResubmitVendorSubmissionRequest request)
    {
        try
        {
            var result = await _vendor.ResubmitAsync(id, GetUserId(), request.Notes);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, new
            {
                message = "Resubmission berhasil dibuat. Silakan upload file PDF baru.",
                newSubmissionId = result.Id,
                submissionNumber = result.SubmissionNumber,
                resubmissionCount = result.ResubmissionCount,
                uploadUrl = $"/api/vendor/submissions/{result.Id}/upload"
            });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Cek status resubmission (berapa kali sudah resubmit)</summary>
    [HttpGet("submissions/{id:guid}/resubmission-status")]
    public async Task<IActionResult> GetResubmissionStatus(Guid id)
    {
        var submission = await _db.PendingVendorRequests
            .FirstOrDefaultAsync(s => s.Id == id && s.VendorUserId == GetUserId());
        if (submission is null) return NotFound(new { error = "Submission not found." });

        var count = await _vendor.GetResubmissionCountAsync(id);
        return Ok(new
        {
            submissionId = id,
            resubmissionCount = count,
            maxResubmissions = submission.MaxResubmissions,
            remainingAttempts = submission.MaxResubmissions - count,
            canResubmit = submission.Status == VendorSubmissionStatus.Rejected
                       && count < submission.MaxResubmissions
        });
    }

}