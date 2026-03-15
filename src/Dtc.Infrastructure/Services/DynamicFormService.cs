namespace Dtc.Infrastructure.Services;

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Infrastructure.Persistence;

public class DynamicFormService : IDynamicFormService
{
    private readonly DtcDbContext _db;
    private readonly ILogger<DynamicFormService> _logger;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public DynamicFormService(DtcDbContext db, ILogger<DynamicFormService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<MetaSchemaField>> GetSchemaAsync(Guid documentTypeId)
    {
        var docType = await _db.DocumentTypes
            .FirstOrDefaultAsync(d => d.Id == documentTypeId && !d.IsDeleted);

        if (docType is null || string.IsNullOrEmpty(docType.MetaSchema))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<MetaSchemaField>>(
                docType.MetaSchema, _json) ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to parse MetaSchema for DocumentType {Id}", documentTypeId);
            return [];
        }
    }

    public async Task<List<MetaSchemaField>> UpdateSchemaAsync(
        Guid documentTypeId, UpdateMetaSchemaRequest request)
    {
        var docType = await _db.DocumentTypes
            .FirstOrDefaultAsync(d => d.Id == documentTypeId && !d.IsDeleted)
            ?? throw new ArgumentException("DocumentType not found.");

        // Sort by order, reindex
        var fields = request.Fields
            .OrderBy(f => f.Order)
            .Select((f, i) => f with { Order = i + 1 })
            .ToList();

        docType.MetaSchema = JsonSerializer.Serialize(fields, _json);
        docType.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "MetaSchema updated for DocumentType {Id}: {Count} fields",
            documentTypeId, fields.Count);

        return fields;
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidateDataAsync(
        Guid documentTypeId, string dynamicDataJson)
    {
        var schema = await GetSchemaAsync(documentTypeId);
        var errors = new List<string>();

        if (!schema.Any()) return (true, errors);

        Dictionary<string, object?>? data;
        try
        {
            data = JsonSerializer.Deserialize<Dictionary<string, object?>>(
                dynamicDataJson, _json);
        }
        catch
        {
            return (false, ["DynamicData JSON tidak valid."]);
        }

        if (data is null) return (false, ["DynamicData tidak boleh kosong."]);

        // Validasi required fields
        foreach (var field in schema.Where(f => f.Required))
        {
            if (!data.ContainsKey(field.Key) ||
                data[field.Key] is null ||
                string.IsNullOrWhiteSpace(data[field.Key]?.ToString()))
            {
                errors.Add($"Field '{field.Label}' wajib diisi.");
            }
        }

        return (errors.Count == 0, errors);
    }

    public async Task<DocumentTypeWithSchemaDto?> GetDocumentTypeWithSchemaAsync(Guid id)
    {
        var docType = await _db.DocumentTypes
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

        if (docType is null) return null;

        var schema = string.IsNullOrEmpty(docType.MetaSchema)
            ? []
            : JsonSerializer.Deserialize<List<MetaSchemaField>>(
                docType.MetaSchema, _json) ?? [];

        return new DocumentTypeWithSchemaDto(
            docType.Id,
            docType.Name,
            docType.Code,
            docType.Description,
            docType.NumberingFormat,
            docType.SequencePadding,
            docType.IsActive,
            docType.ApplicableModules,
            schema,
            docType.CreatedAt,
            docType.UpdatedAt
        );
    }
}
