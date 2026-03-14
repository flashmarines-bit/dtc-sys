using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<WorkflowAction> WorkflowActions { get; set; } = [];
}
