namespace Dtc.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/system-settings")]
[Authorize(Roles = Roles.AdminOrAbove)]
public class SystemSettingsController : ControllerBase
{
    private readonly ISystemSettingService _settings;
    public SystemSettingsController(ISystemSettingService settings) => _settings = settings;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category = null)
        => Ok(await _settings.GetAllAsync(category));

    [HttpGet("email")]
    public async Task<IActionResult> GetEmailSettings()
        => Ok(await _settings.GetEmailSettingsAsync());

    [HttpPost("email")]
    public async Task<IActionResult> SaveEmailSettings([FromBody] EmailSettingsDto dto)
    {
        await _settings.SaveEmailSettingsAsync(dto);
        return Ok(new { message = "Email settings saved." });
    }

    [HttpPost("email/test")]
    public async Task<IActionResult> TestEmail([FromBody] TestEmailRequest request)
    {
        var settings = await _settings.GetEmailSettingsAsync();
        var success = await _settings.TestEmailConnectionAsync(settings with
        {
            ValidatorEmail = request.ToEmail
        });
        return Ok(new { success, message = success ? "Test email sent!" : "Failed to send email." });
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Set(string key, [FromBody] string value)
    {
        await _settings.SetValueAsync(key, value);
        return Ok(new { message = "Setting updated." });
    }


    // Public endpoint — dipakai login page (no auth required)
    [HttpGet("public/it-support")]
    [AllowAnonymous]
    public async Task<IActionResult> GetItSupport()
    {
        var url   = await _settings.GetValueAsync("it_support_url");
        var label = await _settings.GetValueAsync("it_support_label");
        return Ok(new {
            url   = url   ?? "",
            label = label ?? "IT Support"
        });
    }
    [HttpDelete("{key}")]
    public async Task<IActionResult> Delete(string key)
    {
        var result = await _settings.DeleteAsync(key);
        if (!result) return NotFound(new { error = "Setting not found." });
        return Ok(new { message = "Setting deleted." });
    }
}
