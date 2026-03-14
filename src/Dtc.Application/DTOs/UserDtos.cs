namespace Dtc.Application.DTOs;

public record UserListResponse(
    int TotalCount,
    int Page,
    int PageSize,
    List<UserDto> Users
);

public record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role
);

public record UpdateUserRequest(
    string? FullName,
    string? Email,
    string? Role,
    bool? IsActive
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
