namespace Dtc.Application.DTOs;

/// <summary>Definisi satu field dalam MetaSchema</summary>
public record MetaSchemaField(
    string Key,           // unique key, e.g. "NomorInvoice"
    string Label,         // display label, e.g. "Nomor Invoice"
    string Type,          // text|number|currency|date|daterange|textarea|select|checkbox
    bool Required,        // wajib diisi?
    int Order,            // urutan tampil di form
    string? Placeholder,  // hint text
    string? HelpText,     // penjelasan tambahan
    string? DefaultValue, // nilai default
    List<string>? Options // untuk type=select
);

/// <summary>Request untuk update MetaSchema</summary>
public record UpdateMetaSchemaRequest(
    List<MetaSchemaField> Fields
);

/// <summary>Response DocumentType dengan parsed schema</summary>
public record DocumentTypeWithSchemaDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    string NumberingFormat,
    int SequencePadding,
    bool IsActive,
    string? ApplicableModules,
    List<MetaSchemaField> Schema,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
