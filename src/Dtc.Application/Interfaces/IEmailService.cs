namespace Dtc.Application.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody);
    Task SendValidatorNotificationAsync(string validatorEmail, string submissionId, string vendorName, string previewUrl);
    Task SendVendorApprovedAsync(string vendorEmail, string vendorName, string documentNumber, string downloadUrl);
    Task SendVendorRejectedAsync(string vendorEmail, string vendorName, string reason, string category);
}
