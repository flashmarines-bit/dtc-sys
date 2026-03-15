namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.Interfaces;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications)
        => _notifications = notifications;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value!);

    /// <summary>GET in-app notifications (bell icon)</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var notifications = await _notifications.GetInAppAsync(
            GetUserId(), page, pageSize);
        return Ok(notifications);
    }

    /// <summary>GET unread count (badge number)</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notifications.GetUnreadCountAsync(GetUserId());
        return Ok(new { unreadCount = count });
    }

    /// <summary>Mark single notification as read</summary>
    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        await _notifications.MarkAsReadAsync(id, GetUserId());
        return Ok(new { message = "Marked as read" });
    }

    /// <summary>Mark all as read</summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notifications.MarkAllAsReadAsync(GetUserId());
        return Ok(new { message = "All marked as read" });
    }
}
