using Dtc.Domain.Common;
namespace Dtc.Domain.Entities;

public class DocumentType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Numbering format e.g. "INV/{YEAR}/{DEPT}/{SEQ}"
    public string NumberingFormat { get; set; } = string.Empty;
    public int SequencePadding { get; set; } = 5;

    /// <summary>
    /// Dynamic form schema — JSON array of field definitions.
    /// Example:
    /// [
    ///   {"key":"NomorInvoice","label":"Nomor Invoice","type":"text","required":true,"order":1},
    ///   {"key":"NilaiInvoice","label":"Nilai Invoice","type":"currency","required":true,"order":2},
    ///   {"key":"PeriodePekerjaan","label":"Periode Pekerjaan","type":"daterange","required":true,"order":3},
    ///   {"key":"LokasiPekerjaan","label":"Lokasi Pekerjaan","type":"text","required":false,"order":4}
    /// ]
    /// Field types: text, number, currency, date, daterange, textarea, select, checkbox
    /// </summary>
    public string? MetaSchema { get; set; }

    /// <summary>Module yang menggunakan tipe ini: Module1, Module2, Module3, All</summary>
    public string? ApplicableModules { get; set; } = "All";

    // Navigation
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<WorkflowTemplate> WorkflowTemplates { get; set; } = [];
}
