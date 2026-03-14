using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class DocumentVersion : BaseEntity
{
    public int VersionNumber { get; set; } = 1;
    public string? Notes { get; set; }
    public string? StoragePath { get; set; }

    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}
