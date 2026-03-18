namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Infrastructure.Persistence;

public class DocumentTypeService : IDocumentTypeService
{
    private readonly DtcDbContext _db;

    public DocumentTypeService(DtcDbContext db)
    {
        _db = db;
    }

    public async Task<DocumentTypeListResponse> GetAllAsync(int page = 1, int pageSize = 20, string? search = null)
    {
        var query = _db.Set<DocumentType>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(dt =>
                dt.Name.ToLower().Contains(s) ||
                dt.Code.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(dt => dt.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(dt => new DocumentTypeDto(
                dt.Id, dt.Name, dt.Code, dt.Description,
                dt.NumberingFormat, dt.SequencePadding,
                dt.IsActive, dt.ApplicableModules,
                dt.CreatedAt, dt.UpdatedAt))
            .ToListAsync();

        return new DocumentTypeListResponse(totalCount, page, pageSize, items);
    }

    public async Task<DocumentTypeDto?> GetByIdAsync(Guid id)
    {
        var dt = await _db.Set<DocumentType>().FindAsync(id);
        if (dt is null || dt.IsDeleted) return null;

        return new DocumentTypeDto(
            dt.Id, dt.Name, dt.Code, dt.Description,
            dt.NumberingFormat, dt.SequencePadding,
            dt.IsActive, dt.ApplicableModules,
            dt.CreatedAt, dt.UpdatedAt);
    }

    public async Task<DocumentTypeDto> CreateAsync(CreateDocumentTypeRequest request)
    {
        // Check duplicate code
        var codeExists = await _db.Set<DocumentType>()
            .AnyAsync(dt => dt.Code == request.Code && !dt.IsDeleted);
        if (codeExists)
            throw new InvalidOperationException($"Document type code '{request.Code}' already exists.");

        var entity = new DocumentType
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code.ToUpper(),
            Description = request.Description,
            NumberingFormat = request.NumberingFormat,
            SequencePadding = request.SequencePadding,
            CreatedAt = DateTime.UtcNow
        };

        _db.Set<DocumentType>().Add(entity);
        await _db.SaveChangesAsync();

        return new DocumentTypeDto(
            entity.Id, entity.Name, entity.Code, entity.Description,
            entity.NumberingFormat, entity.SequencePadding,
            entity.IsActive, entity.ApplicableModules,
            entity.CreatedAt, entity.UpdatedAt);
    }

    public async Task<DocumentTypeDto?> UpdateAsync(Guid id, UpdateDocumentTypeRequest request)
    {
        var entity = await _db.Set<DocumentType>().FindAsync(id);
        if (entity is null || entity.IsDeleted) return null;

        if (request.Name is not null)
            entity.Name = request.Name;

        if (request.Code is not null)
        {
            var codeExists = await _db.Set<DocumentType>()
                .AnyAsync(dt => dt.Code == request.Code && dt.Id != id && !dt.IsDeleted);
            if (codeExists)
                throw new InvalidOperationException($"Document type code '{request.Code}' already exists.");
            entity.Code = request.Code.ToUpper();
        }

        if (request.Description is not null)
            entity.Description = request.Description;

        if (request.NumberingFormat is not null)
            entity.NumberingFormat = request.NumberingFormat;

        if (request.SequencePadding.HasValue)
            entity.SequencePadding = request.SequencePadding.Value;

        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new DocumentTypeDto(
            entity.Id, entity.Name, entity.Code, entity.Description,
            entity.NumberingFormat, entity.SequencePadding,
            entity.IsActive, entity.ApplicableModules,
            entity.CreatedAt, entity.UpdatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _db.Set<DocumentType>().FindAsync(id);
        if (entity is null || entity.IsDeleted) return false;

        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }
}
