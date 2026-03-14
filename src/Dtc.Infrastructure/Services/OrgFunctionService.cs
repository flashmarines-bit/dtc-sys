namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Infrastructure.Persistence;

public class OrgFunctionService : IOrgFunctionService
{
    private readonly DtcDbContext _db;

    public OrgFunctionService(DtcDbContext db)
    {
        _db = db;
    }

    public async Task<OrgFunctionListResponse> GetAllAsync(string? search = null)
    {
        var query = _db.OrganizationFunctions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(f =>
                f.Code.ToLower().Contains(s) ||
                f.Name.ToLower().Contains(s));
        }

        var items = await query
            .OrderBy(f => f.SortOrder).ThenBy(f => f.Name)
            .Select(f => new OrgFunctionDto(
                f.Id, f.Code, f.Name, f.Suffix, f.Description, f.SortOrder, f.IsActive))
            .ToListAsync();

        return new OrgFunctionListResponse(items.Count, items);
    }

    public async Task<OrgFunctionDto?> GetByIdAsync(Guid id)
    {
        var f = await _db.OrganizationFunctions.FindAsync(id);
        if (f is null || f.IsDeleted) return null;

        return new OrgFunctionDto(f.Id, f.Code, f.Name, f.Suffix, f.Description, f.SortOrder, f.IsActive);
    }

    public async Task<OrgFunctionDto> CreateAsync(CreateOrgFunctionRequest request)
    {
        var exists = await _db.OrganizationFunctions
            .AnyAsync(f => f.Code == request.Code && !f.IsDeleted);
        if (exists)
            throw new InvalidOperationException($"Function code '{request.Code}' already exists.");

        var entity = new OrganizationFunction
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            Suffix = request.Suffix,
            Description = request.Description,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.OrganizationFunctions.Add(entity);
        await _db.SaveChangesAsync();

        return new OrgFunctionDto(entity.Id, entity.Code, entity.Name, entity.Suffix, entity.Description, entity.SortOrder, entity.IsActive);
    }

    public async Task<OrgFunctionDto?> UpdateAsync(Guid id, UpdateOrgFunctionRequest request)
    {
        var entity = await _db.OrganizationFunctions.FindAsync(id);
        if (entity is null || entity.IsDeleted) return null;

        if (request.Code is not null)
        {
            var exists = await _db.OrganizationFunctions
                .AnyAsync(f => f.Code == request.Code && f.Id != id && !f.IsDeleted);
            if (exists)
                throw new InvalidOperationException($"Function code '{request.Code}' already exists.");
            entity.Code = request.Code;
        }

        if (request.Name is not null) entity.Name = request.Name;
        if (request.Suffix is not null) entity.Suffix = request.Suffix;
        if (request.Description is not null) entity.Description = request.Description;
        if (request.SortOrder.HasValue) entity.SortOrder = request.SortOrder.Value;
        if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;

        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new OrgFunctionDto(entity.Id, entity.Code, entity.Name, entity.Suffix, entity.Description, entity.SortOrder, entity.IsActive);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _db.OrganizationFunctions.FindAsync(id);
        if (entity is null || entity.IsDeleted) return false;

        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }
}
