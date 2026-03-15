using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

/// <summary>
/// Key-value store untuk system configuration.
/// Key format: "Category:Key" e.g. "Email:SmtpServer", "Sla:SubmittedToReceived"
/// </summary>
public class SystemSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Description { get; set; }
    public bool IsEncrypted { get; set; } = false;
    public string? Category { get; set; }
}
