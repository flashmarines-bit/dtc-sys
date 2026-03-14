using Dtc.Domain.Common;
using Dtc.Domain.Enums;

namespace Dtc.Domain.Entities;

public class Document : BaseEntity
{
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;

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

    // Navigation
    public ICollection<DocumentVersion> Versions { get; set; } = [];
    public ICollection<WorkflowInstance> WorkflowInstances { get; set; } = [];
    public ICollection<DocumentTracking> TrackingLogs { get; set; } = [];
}
