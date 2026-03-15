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
);public record VendorProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string CompanyName,
    string ContactPhone,
    bool IsActive,
    DateTime CreatedAt
);

public record VendorRegisterRequest(
    string Email,
    string Password,
    string FullName,
    string CompanyName,
    string? PhoneNumber
);
