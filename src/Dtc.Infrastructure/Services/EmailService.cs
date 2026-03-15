namespace Dtc.Infrastructure.Services;

using Dtc.Application.Interfaces;
using Microsoft.Extensions.Logging;

/// <summary>
/// Stub email service — replace with SMTP/SendGrid implementation later
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string htmlBody)
    {
        _logger.LogInformation("[EMAIL STUB] To: {To} | Subject: {Subject}", to, subject);
        return Task.CompletedTask;
    }

    public Task SendValidatorNotificationAsync(string validatorEmail, string submissionId, string vendorName, string previewUrl)
    {
        _logger.LogInformation("[EMAIL STUB] Validator notification → {Email} | Submission: {Id} | Vendor: {Vendor}",
            validatorEmail, submissionId, vendorName);
        return Task.CompletedTask;
    }

    public Task SendVendorApprovedAsync(string vendorEmail, string vendorName, string documentNumber, string downloadUrl)
    {
        _logger.LogInformation("[EMAIL STUB] Vendor approved → {Email} | DocNumber: {Number}",
            vendorEmail, documentNumber);
        return Task.CompletedTask;
    }

    public Task SendVendorRejectedAsync(string vendorEmail, string vendorName, string reason, string category)
    {
        _logger.LogInformation("[EMAIL STUB] Vendor rejected → {Email} | Reason: {Reason}",
            vendorEmail, reason);
        return Task.CompletedTask;
    }
}
