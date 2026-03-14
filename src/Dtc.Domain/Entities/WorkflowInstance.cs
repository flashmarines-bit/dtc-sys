using Dtc.Domain.Common;
using Dtc.Domain.Enums;

namespace Dtc.Domain.Entities;

public class WorkflowInstance : BaseEntity
{
    public bool IsCompleted { get; set; } = false;
    public int CurrentStepOrder { get; set; } = 1;

    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;

    public Guid WorkflowTemplateId { get; set; }
    public WorkflowTemplate WorkflowTemplate { get; set; } = null!;

    public ICollection<WorkflowAction> Actions { get; set; } = [];
}

public class WorkflowAction : BaseEntity
{
    public WorkflowActionType ActionType { get; set; }
    public string? Comment { get; set; }
    public int StepOrder { get; set; }

    public Guid WorkflowInstanceId { get; set; }
    public WorkflowInstance WorkflowInstance { get; set; } = null!;

    public Guid ActedByUserId { get; set; }
    public User ActedByUser { get; set; } = null!;
}
