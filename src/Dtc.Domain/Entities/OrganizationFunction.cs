using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

/// <summary>
/// Represents a function/position in the organization.
/// Used as placeholder {FUNGSI} and {SUFFIX} in document numbering.
/// Example: Code=PHR14410, Name=DWI Engineering, Suffix=S0
/// </summary>
public class OrganizationFunction : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Suffix { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
