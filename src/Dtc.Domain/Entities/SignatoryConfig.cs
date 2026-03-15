using Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

/// <summary>
/// Konfigurasi pejabat penandatangan dokumen.
/// Digunakan untuk generate nomor surat berdasarkan siapa yang tandatangan.
/// </summary>
public class SignatoryConfig : BaseEntity
{
    public string SignatoryName { get; set; } = string.Empty;
    public string SignatoryTitle { get; set; } = string.Empty;

    // Alias untuk fuzzy matching OCR result
    // Format: "ALIAS1|ALIAS2|ALIAS3"
    public string? NameAliases { get; set; }

    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Numbering config
    public string NumberingFormat { get; set; } = string.Empty;
    public int SequencePadding { get; set; } = 4;

    // Relations
    public Guid DocumentTypeId { get; set; }
    public DocumentType DocumentType { get; set; } = null!;

    public Guid OrganizationFunctionId { get; set; }
    public OrganizationFunction OrganizationFunction { get; set; } = null!;
}
