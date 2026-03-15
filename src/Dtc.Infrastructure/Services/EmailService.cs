namespace Dtc.Infrastructure.Services;

using System.Net;
using System.Net.Mail;
using Dtc.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _config;
    private readonly ISystemSettingService _settings;

    public EmailService(IConfiguration config, ILogger<EmailService> logger,
        ISystemSettingService settings)
    {
        _logger = logger;
        _config = config;
        _settings = settings;
    }

    private async Task<(string server, int port, string email, string name, string password, string validatorEmail)> GetConfigAsync()
    {
        // Try DB first, fallback to appsettings
        var server   = await _settings.GetValueAsync("Email:SmtpServer")   ?? _config["Email:SmtpServer"]   ?? "smtp.gmail.com";
        var portStr  = await _settings.GetValueAsync("Email:SmtpPort")     ?? _config["Email:SmtpPort"]     ?? "587";
        var email    = await _settings.GetValueAsync("Email:SenderEmail")  ?? _config["Email:SenderEmail"]  ?? "";
        var name     = await _settings.GetValueAsync("Email:SenderName")   ?? _config["Email:SenderName"]   ?? "DTC System";
        var password = await _settings.GetValueAsync("Email:AppPassword")  ?? _config["Email:AppPassword"]  ?? "";
        var validator= await _settings.GetValueAsync("Email:ValidatorEmail")?? _config["Email:ValidatorEmail"]?? email;

        return (server, int.TryParse(portStr, out var p) ? p : 587, email, name, password, validator);
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var (server, port, senderEmail, senderName, password, _) = await GetConfigAsync();

        if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("[EMAIL] Config incomplete — skipping send to {To}", to);
            return;
        }

        try
        {
            using var client = new SmtpClient(server, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, password)
            };
            using var msg = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            msg.To.Add(to);
            await client.SendMailAsync(msg);
            _logger.LogInformation("✓ Email sent to {To} | {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
        }
    }

    public async Task SendValidatorNotificationAsync(
        string _, string submissionId, string vendorName, string previewUrl)
    {
        var (_, _, _, _, _, validatorEmail) = await GetConfigAsync();
        var subject = $"[DTC] Submission Baru dari {vendorName}";
        var html = $"""
            <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">Submission Baru Menunggu Review</h2>
            <table style="border-collapse:collapse;width:100%;">
                <tr><td style="padding:8px;font-weight:bold;">Vendor</td>
                    <td style="padding:8px;">{vendorName}</td></tr>
                <tr style="background:#f5f5f5;">
                    <td style="padding:8px;font-weight:bold;">Submission ID</td>
                    <td style="padding:8px;">{submissionId}</td></tr>
            </table><br>
            <a href="{previewUrl}" style="background:#1e3a5f;color:white;padding:10px 20px;
               text-decoration:none;border-radius:4px;">Buka Halaman Review</a>
            <br><br><p style="color:#666;font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(validatorEmail, subject, html);
    }

    public async Task SendVendorApprovedAsync(
        string vendorEmail, string vendorName, string documentNumber, string downloadUrl)
    {
        var subject = $"[DTC] Pengajuan Disetujui — Nomor: {documentNumber}";
        var html = $"""
            <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">Pengajuan Dokumen Disetujui</h2>
            <p>Yth. <strong>{vendorName}</strong>,</p>
            <p>Pengajuan dokumen Anda telah <strong style="color:green;">DISETUJUI</strong>.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0;">
                <tr style="background:#f0f7f0;">
                    <td style="padding:12px;font-weight:bold;">Nomor Dokumen</td>
                    <td style="padding:12px;font-size:18px;font-weight:bold;color:#1e3a5f;">
                        {documentNumber}</td></tr>
            </table>
            <p>Dokumen tersimpan di sistem dan dapat diakses melalui Document Library.</p>
            <p style="color:#666;font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(vendorEmail, subject, html);
    }

    public async Task SendVendorRejectedAsync(
        string vendorEmail, string vendorName, string reason, string category)
    {
        var subject = "[DTC] Pengajuan Dokumen Ditolak";
        var html = $"""
            <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">Pengajuan Dokumen Ditolak</h2>
            <p>Yth. <strong>{vendorName}</strong>,</p>
            <p>Pengajuan dokumen Anda <strong style="color:red;">DITOLAK</strong>.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0;">
                <tr style="background:#fff0f0;">
                    <td style="padding:12px;font-weight:bold;">Kategori</td>
                    <td style="padding:12px;">{category}</td></tr>
                <tr><td style="padding:12px;font-weight:bold;">Alasan</td>
                    <td style="padding:12px;">{reason}</td></tr>
            </table>
            <p>Silakan perbaiki dan submit kembali melalui sistem DTC.</p>
            <p style="color:#666;font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(vendorEmail, subject, html);
    }

    public async Task SendVendorReturnedAsync(
        string vendorEmail, string vendorName, string submissionNumber, string returnNotes)
    {
        var subject = $"[DTC] Pengajuan Dikembalikan untuk Revisi — {submissionNumber}";
        var html = $"""
            <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">Pengajuan Dikembalikan untuk Revisi</h2>
            <p>Yth. <strong>{vendorName}</strong>,</p>
            <p>Pengajuan dokumen Anda <strong style="color:#e67e22;">DIKEMBALIKAN</strong> untuk revisi.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0;">
                <tr style="background:#fff8f0;">
                    <td style="padding:12px;font-weight:bold;">Nomor Pengajuan</td>
                    <td style="padding:12px;">{submissionNumber}</td></tr>
                <tr><td style="padding:12px;font-weight:bold;">Catatan Revisi</td>
                    <td style="padding:12px;">{returnNotes}</td></tr>
            </table>
            <p>Silakan perbaiki dokumen sesuai catatan dan submit kembali melalui sistem DTC.</p>
            <p style="color:#666;font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(vendorEmail, subject, html);
    }

    public async Task SendSlaAlertAsync(string toEmail, string subject, string message)
    {
        var html = $"""
            <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#c0392b;">⚠️ SLA Alert — DTC System</h2>
            <p>{message}</p>
            <p style="color:#666;font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(toEmail, subject, html);
    }

}