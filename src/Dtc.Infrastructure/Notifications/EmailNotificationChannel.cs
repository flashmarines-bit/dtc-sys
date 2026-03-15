namespace Dtc.Infrastructure.Notifications;

using System.Net;
using System.Net.Mail;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class EmailNotificationChannel : INotificationChannel
{
    public NotificationChannel Channel => NotificationChannel.Email;

    private readonly IConfiguration _config;
    private readonly ISystemSettingService _settings;
    private readonly ILogger<EmailNotificationChannel> _logger;

    public EmailNotificationChannel(
        IConfiguration config,
        ISystemSettingService settings,
        ILogger<EmailNotificationChannel> logger)
    {
        _config = config;
        _settings = settings;
        _logger = logger;
    }

    public bool IsEnabled
    {
        get
        {
            var val = _settings.GetValueAsync("Notification:Email:Enabled")
                .GetAwaiter().GetResult();
            return val?.ToLower() != "false";
        }
    }

    public async Task<bool> SendAsync(NotificationRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
        {
            _logger.LogWarning("Email notification skipped — no email address");
            return false;
        }

        try
        {
            var server  = await _settings.GetValueAsync("Email:SmtpServer")
                          ?? _config["Email:SmtpServer"] ?? "smtp.gmail.com";
            var portStr = await _settings.GetValueAsync("Email:SmtpPort")
                          ?? _config["Email:SmtpPort"] ?? "587";
            var sender  = await _settings.GetValueAsync("Email:SenderEmail")
                          ?? _config["Email:SenderEmail"] ?? "";
            var name    = await _settings.GetValueAsync("Email:SenderName")
                          ?? _config["Email:SenderName"] ?? "DTC System";
            var pass    = await _settings.GetValueAsync("Email:AppPassword")
                          ?? _config["Email:AppPassword"] ?? "";

            if (string.IsNullOrEmpty(sender) || string.IsNullOrEmpty(pass))
            {
                _logger.LogWarning("Email config incomplete — skipping");
                return false;
            }

            var html = BuildHtml(request);

            using var client = new SmtpClient(server, int.Parse(portStr))
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(sender, pass)
            };
            using var msg = new MailMessage
            {
                From = new MailAddress(sender, name),
                Subject = "[DTC] " + request.Title,
                Body = html,
                IsBodyHtml = true
            };
            msg.To.Add(request.Email);
            await client.SendMailAsync(msg);

            _logger.LogInformation(
                "Email sent | To: {To} | Type: {Type}",
                request.Email, request.Type);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Email failed | To: {To} | Error: {Error}",
                request.Email, ex.Message);
            return false;
        }
    }

    private static string BuildHtml(NotificationRequest request)
    {
        var priorityColor = request.Priority switch
        {
            NotificationPriority.Critical => "#c0392b",
            NotificationPriority.High     => "#e67e22",
            NotificationPriority.Normal   => "#1e3a5f",
            _                             => "#7f8c8d"
        };

        var actionButton = request.ActionUrl is not null
            ? "<br><a href=\"" + request.ActionUrl + "\" " +
              "style=\"display:inline-block;background:" + priorityColor + ";" +
              "color:white;padding:10px 20px;text-decoration:none;" +
              "border-radius:4px;margin-top:16px;\">Buka di DTC System</a>"
            : "";

        return "<html><body style=\"font-family:Arial,sans-serif;padding:20px;max-width:600px;\">" +
               "<div style=\"border-left:4px solid " + priorityColor + ";padding-left:16px;margin-bottom:20px;\">" +
               "<h2 style=\"color:" + priorityColor + ";margin:0 0 8px;\">" + request.Title + "</h2>" +
               "<p style=\"color:#333;margin:0;\">" + request.Message + "</p>" +
               "</div>" +
               actionButton +
               "<br><br>" +
               "<p style=\"color:#999;font-size:11px;\">Email otomatis dari DTC System. Jangan balas email ini.</p>" +
               "</body></html>";
    }
}
