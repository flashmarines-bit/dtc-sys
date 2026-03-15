namespace Dtc.Infrastructure.Services;

using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Infrastructure.Persistence;

public class SystemSettingService : ISystemSettingService
{
    private readonly DtcDbContext _db;

    public SystemSettingService(DtcDbContext db) => _db = db;

    public async Task<List<SystemSettingDto>> GetAllAsync(string? category = null)
    {
        var query = _db.SystemSettings.AsQueryable();
        if (!string.IsNullOrEmpty(category))
            query = query.Where(s => s.Category == category);

        return await query
            .OrderBy(s => s.Category).ThenBy(s => s.Key)
            .Select(s => new SystemSettingDto(
                s.Key, 
                s.IsEncrypted ? "••••••••" : s.Value,
                s.Description, s.Category, s.IsEncrypted,
                s.UpdatedAt ?? s.CreatedAt))
            .ToListAsync();
    }

    public async Task<string?> GetValueAsync(string key)
    {
        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);
        return setting?.Value;
    }

    public async Task SetValueAsync(string key, string value, 
        string? description = null, string? category = null)
    {
        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting is null)
        {
            setting = new SystemSetting
            {
                Key = key,
                Category = category ?? key.Split(':')[0],
                CreatedAt = DateTime.UtcNow
            };
            _db.SystemSettings.Add(setting);
        }

        setting.Value = value;
        if (description != null) setting.Description = description;
        setting.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(string key)
    {
        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);
        if (setting is null) return false;
        _db.SystemSettings.Remove(setting);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<EmailSettingsDto> GetEmailSettingsAsync()
    {
        var settings = await _db.SystemSettings
            .Where(s => s.Category == "Email")
            .ToDictionaryAsync(s => s.Key, s => s.Value ?? "");

        return new EmailSettingsDto(
            SmtpServer:     settings.GetValueOrDefault("Email:SmtpServer", "smtp.gmail.com"),
            SmtpPort:       int.TryParse(settings.GetValueOrDefault("Email:SmtpPort", "587"), out var p) ? p : 587,
            SenderEmail:    settings.GetValueOrDefault("Email:SenderEmail", ""),
            SenderName:     settings.GetValueOrDefault("Email:SenderName", "DTC System"),
            AppPassword:    null, // never expose password
            ValidatorEmail: settings.GetValueOrDefault("Email:ValidatorEmail", "")
        );
    }

    public async Task SaveEmailSettingsAsync(EmailSettingsDto dto)
    {
        var settings = new Dictionary<string, (string value, string desc)>
        {
            ["Email:SmtpServer"]     = (dto.SmtpServer, "SMTP Server address"),
            ["Email:SmtpPort"]       = (dto.SmtpPort.ToString(), "SMTP Port (usually 587)"),
            ["Email:SenderEmail"]    = (dto.SenderEmail, "Sender email address"),
            ["Email:SenderName"]     = (dto.SenderName, "Display name for sent emails"),
            ["Email:ValidatorEmail"] = (dto.ValidatorEmail, "Email to receive validator notifications"),
        };

        // Only update password if provided
        if (!string.IsNullOrEmpty(dto.AppPassword))
            settings["Email:AppPassword"] = (dto.AppPassword, "SMTP App Password (encrypted)");

        foreach (var (key, (value, desc)) in settings)
            await SetValueAsync(key, value, desc, "Email");
    }

    public async Task<bool> TestEmailConnectionAsync(EmailSettingsDto settings)
    {
        try
        {
            var password = settings.AppPassword
                ?? await GetValueAsync("Email:AppPassword")
                ?? "";

            using var client = new SmtpClient(settings.SmtpServer, settings.SmtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(settings.SenderEmail, password)
            };

            using var msg = new MailMessage
            {
                From = new MailAddress(settings.SenderEmail, settings.SenderName),
                Subject = "[DTC] Email Connection Test",
                Body = "<h3>Connection test successful!</h3><p>DTC email service is working.</p>",
                IsBodyHtml = true
            };
            msg.To.Add(settings.ValidatorEmail);
            await client.SendMailAsync(msg);
            return true;
        }
        catch { return false; }
    }
}
