namespace Dtc.Application.DTOs;

public record SystemSettingDto(
    string Key,
    string? Value,
    string? Description,
    string? Category,
    bool IsEncrypted,
    DateTime UpdatedAt
);

public record EmailSettingsDto(
    string SmtpServer,
    int SmtpPort,
    string SenderEmail,
    string SenderName,
    string? AppPassword,
    string ValidatorEmail
);

public record TestEmailRequest(
    string ToEmail
);
