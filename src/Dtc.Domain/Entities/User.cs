using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // FIX: Multi-role — disimpan sebagai JSON array di database
    // Contoh: ["Validator", "Verificator"] atau ["Admin"]
    public List<string> Roles { get; set; } = ["User"];

    // Helper: role utama (untuk backward compatibility)
    public string PrimaryRole => Roles.FirstOrDefault() ?? "User";

    // Helper: cek apakah user punya role tertentu
    public bool HasRole(string role) => Roles.Contains(role);
    public bool HasAnyRole(params string[] roles) => roles.Any(r => Roles.Contains(r));

    public bool IsActive { get; set; } = true;

    // Auth tokens
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Vendor-specific fields
    public string? CompanyName { get; set; }
    public string? ContactPhone { get; set; }

    // Navigation
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<WorkflowAction> WorkflowActions { get; set; } = [];
}
