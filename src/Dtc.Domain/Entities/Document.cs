using Dtc.Domain.Common;
using Dtc.Domain.Enums;

namespace Dtc.Domain.Entities;

public class Document : BaseEntity
{
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;

    // Physical tracking (Module 1)
    public string? QrCode { get; set; }                     // DTC-TRK-2026-000001
    public string? VendorName { get; set; }
    public string? ReferenceNumber { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? ReviewStartedAt { get; set; }
    public string? ReturnReason { get; set; }

    // Storage
    public string? StoragePath { get; set; }
    public StorageStage StorageStage { get; set; } = StorageStage.Temp;
    public string? OriginalFileName { get; set; }
    public string? MimeType { get; set; }
    public long? FileSizeBytes { get; set; }

    // Relations
    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public Guid? OrganizationFunctionId { get; set; }
    public OrganizationFunction? OrganizationFunction { get; set; }

    // Library (Module 2)
    public bool IsLibraryDocument { get; set; } = false;
    public LibraryStatus LibraryStatus { get; set; } = LibraryStatus.None;
    public string? Tags { get; set; }                   // comma-separated tags
    public string? Category { get; set; }
    public Guid? LibraryReviewedByUserId { get; set; }
    public User? LibraryReviewedByUser { get; set; }
    public DateTime? LibraryApprovedAt { get; set; }
    public string? LibraryRejectionReason { get; set; }

    // Navigation
    public ICollection<DocumentVersion> Versions { get; set; } = [];
    public ICollection<WorkflowInstance> WorkflowInstances { get; set; } = [];
    public ICollection<DocumentTracking> TrackingLogs { get; set; } = [];
}
