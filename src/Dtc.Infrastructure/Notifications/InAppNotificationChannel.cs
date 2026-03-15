namespace Dtc.Infrastructure.Notifications;

using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

public class InAppNotificationChannel : INotificationChannel
{
    public NotificationChannel Channel => NotificationChannel.InApp;
    public bool IsEnabled => true; // Always enabled

    private readonly DtcDbContext _db;
    private readonly ILogger<InAppNotificationChannel> _logger;

    public InAppNotificationChannel(
        DtcDbContext db,
        ILogger<InAppNotificationChannel> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<bool> SendAsync(NotificationRequest request)
    {
        if (request.UserId is null) return false;

        try
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Message = request.Message,
                Type = request.Type,
                Channel = NotificationChannel.InApp,
                Priority = request.Priority,
                Status = NotificationStatus.Sent,
                UserId = request.UserId,
                UserEmail = request.Email,
                EntityType = request.EntityType,
                EntityId = request.EntityId,
                ActionUrl = request.ActionUrl,
                MetadataJson = request.MetadataJson,
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "✅ InApp notification saved | UserId: {UserId} | Type: {Type}",
                request.UserId, request.Type);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ InApp notification failed | UserId: {UserId}",
                request.UserId);
            return false;
        }
    }
}
