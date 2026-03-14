namespace Dtc.Domain.Enums;

public enum DocumentStatus
{
    Draft = 0,
    Submitted = 1,
    UnderReview = 2,
    Approved = 3,
    Rejected = 4,
    Archived = 5
}

public enum WorkflowActionType
{
    Approve = 0,
    Reject = 1,
    RequestRevision = 2
}

public enum StorageStage
{
    Temp = 0,
    Quarantine = 1,
    Archive = 2
}
