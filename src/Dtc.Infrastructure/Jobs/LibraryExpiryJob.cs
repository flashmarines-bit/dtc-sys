namespace Dtc.Infrastructure.Jobs;

using Microsoft.Extensions.Logging;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Hangfire;

public class LibraryExpiryJob
{
    private readonly ILibraryService _library;
    private readonly INotificationService _notifications;
    private readonly ILogger<LibraryExpiryJob> _logger;

    public LibraryExpiryJob(
        ILibraryService library,
        INotificationService notifications,
        ILogger<LibraryExpiryJob> logger)
    {
        _library = library;
        _notifications = notifications;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 0)]
    public async Task CheckExpiringDocumentsAsync()
    {
        // Cek 30 hari ke depan
        var expiring30 = await _library.GetExpiringDocumentsAsync(30);
        // Cek 7 hari ke depan
        var expiring7 = await _library.GetExpiringDocumentsAsync(7);

        foreach (var doc in expiring30)
        {
            var daysLeft = doc.ContentExpiresAt.HasValue
                ? (int)(doc.ContentExpiresAt.Value - DateTime.UtcNow).TotalDays
                : 0;

            var priority = daysLeft <= 7
                ? NotificationPriority.High
                : NotificationPriority.Normal;

            await _notifications.BroadcastToRoleAsync("Admin",
                new NotificationRequest
                {
                    Title = daysLeft <= 7
                        ? $"🚨 Dokumen Kadaluarsa {daysLeft} Hari Lagi"
                        : $"⚠️ Dokumen Kadaluarsa {daysLeft} Hari Lagi",
                    Message = $"Dokumen library '{doc.Title}' " +
                             $"({doc.DocumentNumber}) akan kadaluarsa " +
                             $"pada {doc.ContentExpiresAt:dd MMM yyyy}. " +
                             $"Harap segera perbarui.",
                    Type = NotificationType.DocumentExpiringSoon,
                    Priority = priority,
                    EntityType = "Document",
                    EntityId = doc.Id,
                    ActionUrl = $"/library/{doc.Id}"
                });

            _logger.LogWarning(
                "Library expiry alert: {Title} expires in {Days} days",
                doc.Title, daysLeft);
        }

        _logger.LogInformation(
            "Library expiry check: {Count30} docs expiring in 30 days, " +
            "{Count7} in 7 days",
            expiring30.Count, expiring7.Count);
    }
}
