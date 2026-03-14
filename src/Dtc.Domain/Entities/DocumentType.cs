using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class DocumentType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Numbering format e.g. "INV/{YEAR}/{DEPT}/{SEQ}"
    public string NumberingFormat { get; set; } = string.Empty;
    public int SequencePadding { get; set; } = 5;

    // Navigation
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<WorkflowTemplate> WorkflowTemplates { get; set; } = [];
}
