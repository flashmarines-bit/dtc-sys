namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface ISystemSettingService
{
    Task<List<SystemSettingDto>> GetAllAsync(string? category = null);
    Task<string?> GetValueAsync(string key);
    Task SetValueAsync(string key, string value, string? description = null, string? category = null);
    Task<bool> DeleteAsync(string key);
    Task<EmailSettingsDto> GetEmailSettingsAsync();
    Task SaveEmailSettingsAsync(EmailSettingsDto settings);
    Task<bool> TestEmailConnectionAsync(EmailSettingsDto settings);
}
