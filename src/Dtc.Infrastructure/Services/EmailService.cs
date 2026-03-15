namespace Dtc.Infrastructure.Services;

using System.Net;
using System.Net.Mail;
using Dtc.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly string _appPassword;
    private readonly string _validatorEmail;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _logger = logger;
        _smtpServer   = config["Email:SmtpServer"] ?? "smtp.gmail.com";
        _smtpPort     = int.Parse(config["Email:SmtpPort"] ?? "587");
        _senderEmail  = config["Email:SenderEmail"] ?? "";
        _senderName   = config["Email:SenderName"] ?? "DTC System";
        _appPassword  = config["Email:AppPassword"] ?? "";
        _validatorEmail = config["Email:ValidatorEmail"] ?? _senderEmail;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        try
        {
            using var client = CreateSmtpClient();
            using var msg = CreateMessage(to, subject, htmlBody);
            await client.SendMailAsync(msg);
            _logger.LogInformation("Email sent to {To} | Subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }

    public async Task SendValidatorNotificationAsync(
        string validatorEmail, string submissionId, string vendorName, string previewUrl)
    {
        var subject = $"[DTC] Submission Baru dari {vendorName}";
        var html = $"""
            <html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1e3a5f;">DTC — Submission Baru Menunggu Review</h2>
            <table style="border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 8px; font-weight: bold;">Vendor</td>
                    <td style="padding: 8px;">{vendorName}</td></tr>
                <tr style="background:#f5f5f5;"><td style="padding: 8px; font-weight: bold;">Submission ID</td>
                    <td style="padding: 8px;">{submissionId}</td></tr>
            </table>
            <br>
            <a href="{previewUrl}" style="background:#1e3a5f; color:white; padding:10px 20px;
               text-decoration:none; border-radius:4px;">Buka Halaman Review</a>
            <br><br>
            <p style="color:#666; font-size:12px;">Email otomatis dari DTC System. Jangan reply email ini.</p>
            </body></html>
            """;
        await SendAsync(_validatorEmail, subject, html);
    }

    public async Task SendVendorApprovedAsync(
        string vendorEmail, string vendorName, string documentNumber, string downloadUrl)
    {
        var subject = $"[DTC] Pengajuan Disetujui — Nomor: {documentNumber}";
        var html = $"""
            <html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1e3a5f;">Pengajuan Dokumen Disetujui</h2>
            <p>Yth. <strong>{vendorName}</strong>,</p>
            <p>Pengajuan dokumen Anda telah <strong style="color:green;">DISETUJUI</strong>.</p>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr style="background:#f0f7f0;">
                    <td style="padding: 12px; font-weight: bold;">Nomor Dokumen</td>
                    <td style="padding: 12px; font-size: 18px; font-weight: bold; color: #1e3a5f;">
                        {documentNumber}</td></tr>
            </table>
            <p>Dokumen Anda telah disimpan di sistem dan dapat diakses melalui Document Library.</p>
            <br>
            <p style="color:#666; font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(vendorEmail, subject, html);
    }

    public async Task SendVendorRejectedAsync(
        string vendorEmail, string vendorName, string reason, string category)
    {
        var subject = "[DTC] Pengajuan Dokumen Ditolak";
        var html = $"""
            <html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1e3a5f;">Pengajuan Dokumen Ditolak</h2>
            <p>Yth. <strong>{vendorName}</strong>,</p>
            <p>Mohon maaf, pengajuan dokumen Anda <strong style="color:red;">DITOLAK</strong>
               dengan alasan berikut:</p>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr style="background:#fff0f0;">
                    <td style="padding: 12px; font-weight: bold;">Kategori</td>
                    <td style="padding: 12px;">{category}</td></tr>
                <tr>
                    <td style="padding: 12px; font-weight: bold;">Alasan</td>
                    <td style="padding: 12px;">{reason}</td></tr>
            </table>
            <p>Silakan perbaiki dokumen dan submit kembali melalui sistem DTC.</p>
            <br>
            <p style="color:#666; font-size:12px;">Email otomatis dari DTC System.</p>
            </body></html>
            """;
        await SendAsync(vendorEmail, subject, html);
    }

    private SmtpClient CreateSmtpClient()
    {
        return new SmtpClient(_smtpServer, _smtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_senderEmail, _appPassword)
        };
    }

    private MailMessage CreateMessage(string to, string subject, string htmlBody)
    {
        var msg = new MailMessage
        {
            From = new MailAddress(_senderEmail, _senderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        msg.To.Add(to);
        return msg;
    }
}
