namespace Dtc.Domain.Enums;

public enum DocumentStatus
{
    Draft = 0,
    Submitted = 1,
    Received = 2,       // Front desk received physical doc
    Assigned = 3,       // Assigned to verifier
    UnderReview = 4,    // Verifier is reviewing
    Approved = 5,
    Returned = 6,       // Returned to submitter
    Rejected = 7,
    Archived = 8
}

public enum TrackingEvent
{
    Created = 0,
    Submitted = 1,
    Received = 2,
    Assigned = 3,
    ReviewStarted = 4,
    Approved = 5,
    Returned = 6,
    Rejected = 7,
    Archived = 8,
    HandoverInitiated = 9,
    HandoverConfirmed = 10,
    PhotoProofUploaded = 11,
    FileUploaded = 12,
    NewVersion = 13
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

public enum LibraryStatus
{
    None = 0,           // bukan library document
    Proposed = 1,       // diusulkan masuk library
    UnderReview = 2,    // sedang direview
    Approved = 3,       // disetujui, masuk library
    Archived = 4,       // diarsipkan
    Rejected = 5        // ditolak
}

public enum LibraryTrackingEvent
{
    Proposed = 0,
    ReviewStarted = 1,
    Approved = 2,
    Archived = 3,
    Rejected = 4,
    FileUploaded = 5,
    NewVersion = 6,
    TagsUpdated = 7
}
