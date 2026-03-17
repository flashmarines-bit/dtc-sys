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
    List<string> Roles  // multi-role
);

public record UpdateUserRequest(
    string? FullName,
    string? Email,
    List<string>? Roles,  // multi-role
    bool? IsActive
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
