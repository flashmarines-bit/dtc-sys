namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;
using Dtc.Domain.Entities;
using Dtc.Infrastructure.Persistence;

public class UserService : IUserService
{
    private readonly DtcDbContext _db;

    public UserService(DtcDbContext db)
    {
        _db = db;
    }

    public async Task<UserListResponse> GetUsersAsync(int page = 1, int pageSize = 20, string? search = null)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto(u.Id, u.FullName, u.Email, u.PrimaryRole, u.IsActive))
            .ToListAsync();

        return new UserListResponse(totalCount, page, pageSize, users);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null || user.IsDeleted) return null;

        return new UserDto(user.Id, user.FullName, user.Email, user.PrimaryRole, user.IsActive);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
    {
        // Validate role
        var invalidRoles = (request.Roles ?? []).Where(r => !Roles.All.Contains(r)).ToList();
        if (invalidRoles.Count > 0)
            throw new ArgumentException($"Invalid roles: {string.Join(", ", invalidRoles)}. Valid roles: {string.Join(", ", Roles.All)}");

        // Check duplicate email
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Roles = request.Roles ?? ["User"],
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new UserDto(user.Id, user.FullName, user.Email, user.PrimaryRole, user.IsActive);
    }

    public async Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null || user.IsDeleted) return null;

        if (request.FullName is not null)
            user.FullName = request.FullName;

        if (request.Email is not null)
        {
            var emailTaken = await _db.Users
                .AnyAsync(u => u.Email == request.Email && u.Id != id && !u.IsDeleted);
            if (emailTaken)
                throw new InvalidOperationException("Email already in use.");
            user.Email = request.Email;
        }

        if (request.Roles is not null && request.Roles.Count > 0)
        {
            var invalidRoles = request.Roles.Where(r => !Roles.All.Contains(r)).ToList();
            if (invalidRoles.Count > 0)
                throw new ArgumentException($"Invalid roles: {string.Join(", ", invalidRoles)}");
            user.Roles = request.Roles;
        }

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new UserDto(user.Id, user.FullName, user.Email, user.PrimaryRole, user.IsActive);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null || user.IsDeleted) return false;

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null || user.IsDeleted) return false;

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }
}
