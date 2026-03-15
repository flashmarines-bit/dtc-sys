namespace Dtc.Infrastructure.Jobs;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;
using Hangfire;

public class Module1AlarmJob
{
    private readonly DtcDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<Module1AlarmJob> _logger;

    public Module1AlarmJob(
        DtcDbContext db,
        INotificationService notifications,
        ILogger<Module1AlarmJob> logger)
    {
        _db = db;
        _notifications = notifications;
        _logger = logger;
    }

    // ── ALARM 1: Pre-Arrival Timeout (24 jam) ────────────────────────────
    [AutomaticRetry(Attempts = 0)]
    public async Task CheckPreArrivalTimeoutAsync()
    {
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var docs = await _db.Documents
            .Where(d => d.Status == DocumentStatus.PreArrivalDeclared
                     && d.PreArrivalDeclaredAt < cutoff
                     && !d.EscalationSent
                     && !d.IsDeleted)
            .ToListAsync();

        foreach (var doc in docs)
        {
            var hoursElapsed = (int)(DateTime.UtcNow - doc.PreArrivalDeclaredAt!.Value).TotalHours;

            _logger.LogWarning(
                "ALARM 1 — Pre-Arrival Timeout | Doc: {Number} | {Hours}h elapsed",
                doc.DocumentNumber, hoursElapsed);

            // Eskalasi ke manager
            await _notifications.BroadcastToRoleAsync("Admin", new NotificationRequest
            {
                Title = "⚠️ Dokumen Belum Diterima",
                Message = $"Vendor sudah mendeklarasi mengantar dokumen {doc.DocumentNumber} " +
                         $"{hoursElapsed} jam lalu, tapi belum ada yang scan penerimaan. " +
                         $"Mohon cek kondisi dokumen.",
                Type = NotificationType.PreArrivalTimeout,
                Priority = NotificationPriority.High,
                EntityType = "Document",
                EntityId = doc.Id
            });

            doc.EscalationSent = true;
            doc.UpdatedAt = DateTime.UtcNow;
        }

        if (docs.Any()) await _db.SaveChangesAsync();
        _logger.LogInformation(
            "ALARM 1 checked: {Count} pre-arrival timeout(s)", docs.Count);
    }

    // ── ALARM 2: Drop-Off Unacknowledged (2 jam) ─────────────────────────
    [AutomaticRetry(Attempts = 0)]
    public async Task CheckDropOffUnacknowledgedAsync()
    {
        var cutoff2h = DateTime.UtcNow.AddHours(-2);
        var cutoff4h = DateTime.UtcNow.AddHours(-4);

        var docs = await _db.Documents
            .Include(d => d.AssignedToUser)
            .Where(d => d.Status == DocumentStatus.DroppedOffPendingAck
                     && d.DropOffAt < cutoff2h
                     && !d.IsDeleted)
            .ToListAsync();

        foreach (var doc in docs)
        {
            var hoursElapsed = (int)(DateTime.UtcNow - doc.DropOffAt!.Value).TotalHours;

            // Reminder ke target (Budi)
            if (doc.AssignedToUserId.HasValue)
            {
                await _notifications.SendAsync(new NotificationRequest
                {
                    UserId = doc.AssignedToUserId.Value,
                    Title = "⏰ Reminder: Konfirmasi Titipan Dokumen",
                    Message = $"Dokumen {doc.DocumentNumber} sudah dititipkan " +
                             $"{hoursElapsed} jam lalu di meja Anda. " +
                             $"Harap segera konfirmasi penerimaan.",
                    Type = NotificationType.DropOffUnacknowledged,
                    Priority = hoursElapsed >= 4
                        ? NotificationPriority.High
                        : NotificationPriority.Normal,
                    EntityType = "Document",
                    EntityId = doc.Id,
                    ActionUrl = $"/documents/{doc.Id}/scan"
                });
            }

            // Eskalasi ke manager jika > 4 jam
            if (doc.DropOffAt < cutoff4h && !doc.EscalationSent)
            {
                await _notifications.BroadcastToRoleAsync("Admin", new NotificationRequest
                {
                    Title = "🚨 Eskalasi: Drop-Off Tidak Dikonfirmasi",
                    Message = $"Dokumen {doc.DocumentNumber} sudah dititipkan " +
                             $"{hoursElapsed} jam di meja {doc.AssignedToUser?.FullName ?? "verifikator"} " +
                             $"tapi belum dikonfirmasi.",
                    Type = NotificationType.EscalationToManager,
                    Priority = NotificationPriority.Critical,
                    EntityType = "Document",
                    EntityId = doc.Id
                });
                doc.EscalationSent = true;
                doc.UpdatedAt = DateTime.UtcNow;
            }
        }

        if (docs.Any()) await _db.SaveChangesAsync();
        _logger.LogInformation(
            "ALARM 2 checked: {Count} unacknowledged drop-off(s)", docs.Count);
    }

    // ── ALARM 3: SLA Breach Warning ───────────────────────────────────────
    [AutomaticRetry(Attempts = 0)]
    public async Task CheckSlaBreachAsync()
    {
        var now = DateTime.UtcNow;

        // Dokumen yang SLA-nya mau habis (< 2 jam lagi) atau sudah breach
        var docs = await _db.Documents
            .Include(d => d.AssignedToUser)
            .Where(d => d.SlaStartedAt != null
                     && d.SlaDeadlineAt != null
                     && !d.SlaBreached
                     && d.Status == DocumentStatus.InReview
                     && !d.IsDeleted)
            .ToListAsync();

        foreach (var doc in docs)
        {
            var timeLeft = doc.SlaDeadlineAt!.Value - now;

            if (timeLeft.TotalHours <= 2 && timeLeft.TotalMinutes > 0)
            {
                // Warning — SLA hampir habis
                if (doc.AssignedToUserId.HasValue)
                {
                    await _notifications.SendAsync(new NotificationRequest
                    {
                        UserId = doc.AssignedToUserId.Value,
                        Title = "⏰ SLA Hampir Habis",
                        Message = $"Dokumen {doc.DocumentNumber} harus selesai direview " +
                                 $"dalam {(int)timeLeft.TotalMinutes} menit lagi.",
                        Type = NotificationType.SlaWarning,
                        Priority = NotificationPriority.High,
                        EntityType = "Document",
                        EntityId = doc.Id
                    });
                }
            }
            else if (timeLeft.TotalMinutes <= 0)
            {
                // SLA Breach
                doc.SlaBreached = true;
                doc.UpdatedAt = DateTime.UtcNow;

                if (doc.AssignedToUserId.HasValue)
                {
                    await _notifications.SendAsync(new NotificationRequest
                    {
                        UserId = doc.AssignedToUserId.Value,
                        Title = "🔴 SLA Breach!",
                        Message = $"Dokumen {doc.DocumentNumber} melewati batas SLA. " +
                                 $"Harap segera selesaikan review.",
                        Type = NotificationType.SlaBreach,
                        Priority = NotificationPriority.Critical,
                        EntityType = "Document",
                        EntityId = doc.Id
                    });
                }

                // Eskalasi ke manager
                await _notifications.BroadcastToRoleAsync("Admin", new NotificationRequest
                {
                    Title = "🚨 SLA Breach",
                    Message = $"Dokumen {doc.DocumentNumber} " +
                             $"(pemegang: {doc.AssignedToUser?.FullName ?? "Unknown"}) " +
                             $"melewati batas SLA.",
                    Type = NotificationType.EscalationToManager,
                    Priority = NotificationPriority.Critical,
                    EntityType = "Document",
                    EntityId = doc.Id
                });
            }
        }

        if (docs.Any()) await _db.SaveChangesAsync();
        _logger.LogInformation("ALARM 3 checked: {Count} SLA doc(s)", docs.Count);
    }

    // ── ALARM 4: OTP Expired ──────────────────────────────────────────────
    [AutomaticRetry(Attempts = 0)]
    public async Task CheckOtpExpiredAsync()
    {
        var now = DateTime.UtcNow;
        var docs = await _db.Documents
            .Where(d => d.Status == DocumentStatus.WaitingPickupConfirmation
                     && d.PickupOtpExpiresAt < now
                     && d.PickupOtpVerifiedAt == null
                     && !d.IsDeleted)
            .ToListAsync();

        foreach (var doc in docs)
        {
            _logger.LogWarning(
                "ALARM 4 — OTP Expired | Doc: {Number}", doc.DocumentNumber);

            // Regenerate OTP otomatis
            var newOtp = new Random().Next(100000, 999999).ToString();
            doc.PickupOtpCode = newOtp;
            doc.PickupOtpExpiresAt = DateTime.UtcNow.AddHours(24);
            doc.UpdatedAt = DateTime.UtcNow;

            // Kirim OTP baru ke vendor
            var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
            if (vendor != null)
            {
                await _notifications.SendAsync(new NotificationRequest
                {
                    UserId = vendor.Id,
                    Email = vendor.Email,
                    Phone = doc.VendorContactPhone,
                    Title = "🔄 PIN Pickup Diperbarui",
                    Message = $"PIN lama untuk pengambilan dokumen {doc.DocumentNumber} " +
                             $"sudah kadaluarsa. PIN baru: {newOtp} (berlaku 24 jam).",
                    Type = NotificationType.OtpExpired,
                    Priority = NotificationPriority.High,
                    EntityType = "Document",
                    EntityId = doc.Id
                });
            }
        }

        if (docs.Any()) await _db.SaveChangesAsync();
        _logger.LogInformation(
            "ALARM 4 checked: {Count} OTP expired, regenerated", docs.Count);
    }

    // ── ALARM 5: Dokumen Mengambang ───────────────────────────────────────
    [AutomaticRetry(Attempts = 0)]
    public async Task CheckFloatingDocumentsAsync()
    {
        var cutoff = DateTime.UtcNow.AddDays(-2);

        var docs = await _db.Documents
            .Where(d => d.Status == DocumentStatus.PreArrivalDeclared
                     && d.PreArrivalDeclaredAt < cutoff
                     && !d.IsDeleted)
            .ToListAsync();

        foreach (var doc in docs)
        {
            var daysElapsed = (int)(DateTime.UtcNow - doc.PreArrivalDeclaredAt!.Value).TotalDays;

            // Reminder ke vendor
            var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
            if (vendor != null)
            {
                await _notifications.SendAsync(new NotificationRequest
                {
                    UserId = vendor.Id,
                    Email = vendor.Email,
                    Title = "❓ Status Dokumen Tidak Jelas",
                    Message = $"Dokumen {doc.DocumentNumber} sudah {daysElapsed} hari " +
                             $"dalam status 'sedang diantar' tapi belum ada konfirmasi penerimaan. " +
                             $"Apakah dokumen sudah diantar?",
                    Type = NotificationType.DocumentFloating,
                    Priority = NotificationPriority.High,
                    EntityType = "Document",
                    EntityId = doc.Id
                });
            }

            // Eskalasi ke admin
            await _notifications.BroadcastToRoleAsync("Admin", new NotificationRequest
            {
                Title = "⚠️ Dokumen Mengambang",
                Message = $"Dokumen {doc.DocumentNumber} sudah {daysElapsed} hari " +
                         $"tidak jelas posisinya. Vendor sudah mengklaim mengantar " +
                         $"tapi belum ada penerimaan.",
                Type = NotificationType.DocumentFloating,
                Priority = NotificationPriority.High,
                EntityType = "Document",
                EntityId = doc.Id
            });
        }

        _logger.LogInformation(
            "ALARM 5 checked: {Count} floating document(s)", docs.Count);
    }
}
