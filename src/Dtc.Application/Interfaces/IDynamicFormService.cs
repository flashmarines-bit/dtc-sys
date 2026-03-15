namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IDynamicFormService
{
    /// <summary>Ambil schema fields untuk DocumentType tertentu</summary>
    Task<List<MetaSchemaField>> GetSchemaAsync(Guid documentTypeId);

    /// <summary>Update schema untuk DocumentType</summary>
    Task<List<MetaSchemaField>> UpdateSchemaAsync(
        Guid documentTypeId, UpdateMetaSchemaRequest request);

    /// <summary>Validasi DynamicData JSON berdasarkan schema</summary>
    Task<(bool IsValid, List<string> Errors)> ValidateDataAsync(
        Guid documentTypeId, string dynamicDataJson);

    /// <summary>Get DocumentType lengkap dengan parsed schema</summary>
    Task<DocumentTypeWithSchemaDto?> GetDocumentTypeWithSchemaAsync(Guid id);
}
