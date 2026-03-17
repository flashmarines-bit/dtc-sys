namespace Dtc.Infrastructure.Notifications;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class NotificationService : INotificationService
{
    private readonly IEnumerable<INotificationChannel> _channels;
    private readonly DtcDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IEnumerable<INotificationChannel> channels,
        DtcDbContext db,
        ILogger<NotificationService> logger)
    {
        _channels = channels;
        _db = db;
        _logger = logger;
    }

    public async Task<NotificationResult> SendAsync(NotificationRequest request)
    {
        var results = new Dictionary<NotificationChannel, bool>();
        var activeChannels = GetActiveChannels(request.Channels);

        foreach (var channel in activeChannels)
        {
            try
            {
                var success = await channel.SendAsync(request);
                results[channel.Channel] = success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Channel {Channel} failed for type {Type}",
                    channel.Channel, request.Type);
                results[channel.Channel] = false;
            }
        }

        var overallSuccess = results.Any(r => r.Value);
        return new NotificationResult
        {
            Success = overallSuccess,
            ChannelResults = results
        };
    }

    public async Task<NotificationResult> BroadcastAsync(
        List<Guid> userIds, NotificationRequest request)
    {
        var users = await _db.Users
            .Where(u => userIds.Contains(u.Id) && u.IsActive && !u.IsDeleted)
            .ToListAsync();

        var tasks = users.Select(user => SendAsync(request with
        {
            UserId = user.Id,
            Email = request.Email ?? user.Email,
            Phone = request.Phone ?? user.ContactPhone
        }));

        var results = await Task.WhenAll(tasks);
        return new NotificationResult
        {
            Success = results.Any(r => r.Success),
            ChannelResults = results
                .SelectMany(r => r.ChannelResults)
                .GroupBy(r => r.Key)
                .ToDictionary(g => g.Key, g => g.Any(r => r.Value))
        };
    }

    public async Task<NotificationResult> BroadcastToRoleAsync(
        string role, NotificationRequest request)
    {
        // FIX: AsEnumerable() tidak support async — load ke memory dulu
        var allUsers = await _db.Users
            .Where(u => u.IsActive && !u.IsDeleted)
            .Select(u => new { u.Id, u.Roles })
            .ToListAsync();
        var userIds = allUsers
            .Where(u => u.Roles.Contains(role))
            .Select(u => u.Id)
            .ToList();

        return await BroadcastAsync(userIds, request);
    }

    public async Task<List<InAppNotificationDto>> GetInAppAsync(
        Guid userId, int page = 1, int pageSize = 20)
    {
        return await _db.Notifications
            .Where(n => n.UserId == userId
                     && n.Channel == NotificationChannel.InApp
                     && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new InAppNotificationDto(
                n.Id,
                n.Title,
                n.Message,
                n.Type,
                n.Priority,
                n.EntityType,
                n.EntityId,
                n.ActionUrl,
                n.ReadAt != null,
                n.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notif = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId
                                   && n.UserId == userId);
        if (notif is null) return;

        notif.ReadAt = DateTime.UtcNow;
        notif.Status = NotificationStatus.Read;
        notif.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId
                     && n.Channel == NotificationChannel.InApp
                     && n.ReadAt == null
                     && !n.IsDeleted)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.ReadAt = DateTime.UtcNow;
            n.Status = NotificationStatus.Read;
            n.UpdatedAt = DateTime.UtcNow;
        }

        if (unread.Any())
            await _db.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _db.Notifications
            .CountAsync(n => n.UserId == userId
                          && n.Channel == NotificationChannel.InApp
                          && n.ReadAt == null
                          && !n.IsDeleted);
    }

    private IEnumerable<INotificationChannel> GetActiveChannels(
        List<NotificationChannel>? channelOverride)
    {
        var active = _channels.Where(c => c.IsEnabled);
        if (channelOverride is not null && channelOverride.Any())
            active = active.Where(c => channelOverride.Contains(c.Channel));
        return active;
    }
}
