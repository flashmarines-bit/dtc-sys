using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class DocumentTracking : BaseEntity
{
    public string Event { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? IpAddress { get; set; }

    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;

    public Guid? ActedByUserId { get; set; }
    public User? ActedByUser { get; set; }
}

public class NumberingRecord : BaseEntity
{
    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public Guid? OrganizationFunctionId { get; set; }
    public OrganizationFunction? OrganizationFunction { get; set; }

    public int Year { get; set; }
    public string? Department { get; set; }
    public int LastSequence { get; set; } = 0;
}
