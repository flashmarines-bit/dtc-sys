using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class WorkflowTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public ICollection<WorkflowStep> Steps { get; set; } = [];
}

public class WorkflowStep : BaseEntity
{
    public int Order { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Role required to action this step
    public string RequiredRole { get; set; } = "User";

    public Guid WorkflowTemplateId { get; set; }
    public WorkflowTemplate WorkflowTemplate { get; set; } = null!;
}
