namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IUserService
{
    Task<UserListResponse> GetUsersAsync(int page = 1, int pageSize = 20, string? search = null);
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto> CreateUserAsync(CreateUserRequest request);
    Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<bool> DeleteUserAsync(Guid id);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}
