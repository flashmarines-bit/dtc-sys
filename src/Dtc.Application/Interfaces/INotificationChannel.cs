namespace Dtc.Application.Interfaces;

using Dtc.Domain.Enums;

/// <summary>Interface untuk setiap channel provider</summary>
public interface INotificationChannel
{
    NotificationChannel Channel { get; }
    bool IsEnabled { get; }
    Task<bool> SendAsync(NotificationRequest request);
}
