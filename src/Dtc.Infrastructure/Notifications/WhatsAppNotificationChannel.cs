namespace Dtc.Infrastructure.Notifications;

using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Microsoft.Extensions.Logging;

/// <summary>
/// WhatsApp notification channel.
/// Inactive by default — activate via System Settings:
/// Notification:WA:Enabled = true
/// Notification:WA:Provider = fonnte|wati|twilio
/// Notification:WA:ApiKey = [encrypted]
/// Notification:WA:SenderNumber = 628xxxxxxxxx
/// </summary>
public class WhatsAppNotificationChannel : INotificationChannel
{
    public NotificationChannel Channel => NotificationChannel.WhatsApp;

    private readonly ISystemSettingService _settings;
    private readonly ILogger<WhatsAppNotificationChannel> _logger;

    public WhatsAppNotificationChannel(
        ISystemSettingService settings,
        ILogger<WhatsAppNotificationChannel> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public bool IsEnabled
    {
        get
        {
            var val = _settings.GetValueAsync("Notification:WA:Enabled")
                .GetAwaiter().GetResult();
            return val?.ToLower() == "true";
        }
    }

    public async Task<bool> SendAsync(NotificationRequest request)
    {
        if (!IsEnabled)
        {
            _logger.LogDebug("WhatsApp notification skipped — not enabled");
            return false;
        }

        if (string.IsNullOrEmpty(request.Phone))
        {
            _logger.LogWarning("WhatsApp notification skipped — no phone number");
            return false;
        }

        var provider = await _settings.GetValueAsync("Notification:WA:Provider")
                       ?? "fonnte";
        var apiKey   = await _settings.GetValueAsync("Notification:WA:ApiKey") ?? "";
        var sender   = await _settings.GetValueAsync("Notification:WA:SenderNumber") ?? "";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("WhatsApp API key not configured");
            return false;
        }

        return provider.ToLower() switch
        {
            "fonnte"  => await SendViaFonnte(request, apiKey, sender),
            "wati"    => await SendViaWati(request, apiKey, sender),
            _         => await SendViaFonnte(request, apiKey, sender)
        };
    }

    private async Task<bool> SendViaFonnte(
        NotificationRequest req, string apiKey, string sender)
    {
        try
        {
            using var http = new System.Net.Http.HttpClient();
            http.DefaultRequestHeaders.Add("Authorization", apiKey);

            var content = new System.Net.Http.FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string,string>("target", req.Phone!),
                new KeyValuePair<string,string>("message",
                    $"*{req.Title}*\n\n{req.Message}" +
                    (req.ActionUrl != null ? $"\n\n🔗 {req.ActionUrl}" : "")),
            });

            var response = await http.PostAsync(
                "https://fonnte.com/api/send-message", content);

            _logger.LogInformation(
                "WhatsApp (Fonnte) sent | Phone: {Phone} | Status: {Status}",
                req.Phone, response.StatusCode);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WhatsApp (Fonnte) failed");
            return false;
        }
    }

    private async Task<bool> SendViaWati(
        NotificationRequest req, string apiKey, string sender)
    {
        // TODO: implement Wati provider
        _logger.LogWarning("Wati provider not yet implemented");
        await Task.CompletedTask;
        return false;
    }
}
