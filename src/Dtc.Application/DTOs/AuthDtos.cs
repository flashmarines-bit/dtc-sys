namespace Dtc.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string FullName, string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record AuthResponse(
    string Token,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive
);
