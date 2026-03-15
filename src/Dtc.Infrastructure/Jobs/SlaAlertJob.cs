namespace Dtc.Infrastructure.Jobs;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class SlaAlertJob
{
    private readonly DtcDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<SlaAlertJob> _logger;

    public SlaAlertJob(DtcDbContext db, IEmailService email,
        IConfiguration config, ILogger<SlaAlertJob> logger)
    {
        _db = db;
        _email = email;
        _config = config;
        _logger = logger;
    }

    /// <summary>Jalankan semua SLA checks — dipanggil oleh Hangfire recurring job</summary>
    public async Task RunAllChecksAsync()
    {
        await CheckUnprocessedSubmissionsAsync();
        await CheckPendingReviewAsync();
        await CheckExpiringSubmissionsAsync();
    }

    /// <summary>Alert: submission masih Pending/Analysing > N jam</summary>
    private async Task CheckUnprocessedSubmissionsAsync()
    {
        var thresholdHours = int.Parse(_config["Sla:UnprocessedHours"] ?? "4");
        var cutoff = DateTime.UtcNow.AddHours(-thresholdHours);

        var stale = await _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Where(s => !s.IsDeleted
                && (s.Status == VendorSubmissionStatus.Pending
                    || s.Status == VendorSubmissionStatus.Analysing)
                && s.CreatedAt < cutoff)
            .ToListAsync();

        if (!stale.Any()) return;

        _logger.LogWarning("SLA: {Count} submission belum diproses > {Hours} jam", stale.Count, thresholdHours);

        var validatorEmail = _config["Email:ValidatorEmail"] ?? _config["Email:SenderEmail"] ?? "";
        var lines = stale.Select(s =>
            $"<li><b>{s.SubmissionNumber}</b> — {s.VendorCompanyName} " +
            $"(sejak {s.CreatedAt:dd MMM yyyy HH:mm} UTC, status: {s.Status})</li>");

        await _email.SendSlaAlertAsync(
            validatorEmail,
            $"[DTC SLA] {stale.Count} Submission Belum Diproses > {thresholdHours} Jam",
            $"<p>Submission berikut belum diproses lebih dari <b>{thresholdHours} jam</b>:</p>" +
            $"<ul>{string.Join("", lines)}</ul>" +
            $"<p>Mohon segera tindak lanjuti.</p>"
        );
    }

    /// <summary>Alert: submission UnderReview > N jam (validator belum review)</summary>
    private async Task CheckPendingReviewAsync()
    {
        var thresholdHours = int.Parse(_config["Sla:PendingReviewHours"] ?? "8");
        var cutoff = DateTime.UtcNow.AddHours(-thresholdHours);

        var pending = await _db.PendingVendorRequests
            .Where(s => !s.IsDeleted
                && s.Status == VendorSubmissionStatus.UnderReview
                && s.AnalysisCompletedAt < cutoff)
            .ToListAsync();

        if (!pending.Any()) return;

        _logger.LogWarning("SLA: {Count} submission belum direview > {Hours} jam", pending.Count, thresholdHours);

        var validatorEmail = _config["Email:ValidatorEmail"] ?? _config["Email:SenderEmail"] ?? "";
        var lines = pending.Select(s =>
            $"<li><b>{s.SubmissionNumber}</b> — {s.VendorCompanyName} " +
            $"(analisis selesai: {s.AnalysisCompletedAt:dd MMM yyyy HH:mm} UTC)</li>");

        await _email.SendSlaAlertAsync(
            validatorEmail,
            $"[DTC SLA] {pending.Count} Submission Menunggu Review > {thresholdHours} Jam",
            $"<p>Submission berikut telah selesai dianalisis namun belum direview lebih dari <b>{thresholdHours} jam</b>:</p>" +
            $"<ul>{string.Join("", lines)}</ul>" +
            $"<p>Mohon segera review di sistem DTC.</p>"
        );
    }

    /// <summary>Alert: submission mendekati expiry < N hari</summary>
    private async Task CheckExpiringSubmissionsAsync()
    {
        var thresholdDays = int.Parse(_config["Sla:ExpiryWarningDays"] ?? "3");
        var warningCutoff = DateTime.UtcNow.AddDays(thresholdDays);

        var expiring = await _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Where(s => !s.IsDeleted
                && s.Status != VendorSubmissionStatus.Accepted
                && s.ExpiresAt <= warningCutoff
                && s.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        if (!expiring.Any()) return;

        _logger.LogWarning("SLA: {Count} submission mendekati expiry", expiring.Count);

        foreach (var s in expiring)
        {
            var daysLeft = (s.ExpiresAt - DateTime.UtcNow).Days;
            await _email.SendSlaAlertAsync(
                s.VendorContactEmail,
                $"[DTC] Pengajuan {s.SubmissionNumber} Akan Kadaluarsa dalam {daysLeft} Hari",
                $"<p>Yth. <b>{s.VendorContactName}</b>,</p>" +
                $"<p>Pengajuan <b>{s.SubmissionNumber}</b> akan kadaluarsa pada " +
                $"<b>{s.ExpiresAt:dd MMM yyyy}</b> ({daysLeft} hari lagi).</p>" +
                $"<p>Segera selesaikan proses pengajuan atau hubungi tim DTC.</p>"
            );
        }
    }
}
