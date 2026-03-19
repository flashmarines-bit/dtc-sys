namespace Dtc.Infrastructure.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Infrastructure.Persistence;

public class AuthService : IAuthService
{
    private readonly DtcDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;

    public AuthService(DtcDbContext db, IConfiguration config, IEmailService emailService)
    {
        _db = db;
        _config = config;
        _emailService = emailService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user, token, refreshToken);
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Roles = ["User"],
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user, token, refreshToken);
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken
                && u.RefreshTokenExpiryTime > DateTime.UtcNow
                && !u.IsDeleted && u.IsActive);

        if (user is null) return null;

        var newToken = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user, newToken, newRefreshToken);
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user is not null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _db.SaveChangesAsync();
        }
    }


    public async Task<AuthResponse> RegisterVendorAsync(VendorRegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Roles = ["Vendor"],
            IsActive = true,
            CompanyName = request.CompanyName,
            ContactPhone = request.PhoneNumber,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user, token, refreshToken);
    }
    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        // FIX: Multi-role — tambah satu claim per role
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        // Tambah setiap role sebagai claim terpisah
        foreach (var role in user.Roles)
            claims.Add(new Claim(ClaimTypes.Role, role));
        var claimsArray = claims.ToArray();

        var expiryMinutes = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claimsArray,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private AuthResponse BuildAuthResponse(User user, string token, string refreshToken)
    {
        var expiryMinutes = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");
        return new AuthResponse(
            Token: token,
            RefreshToken: refreshToken,
            ExpiresAt: DateTime.UtcNow.AddMinutes(expiryMinutes),
            User: new UserDto(
                Id: user.Id,
                FullName: user.FullName,
                Email: user.Email,
                Role: user.PrimaryRole,
                IsActive: user.IsActive,
                Roles: user.Roles  // kirim semua roles
            )
        );
    }
    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        if (user is null) return; // Silent — jangan bocorkan email mana yang terdaftar

        // Generate secure token
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _db.SaveChangesAsync();

        // Kirim email
        var resetUrl = $"{_config["App:VendorPortalUrl"]}/reset-password?token={token}";
        await _emailService.SendAsync(
            to: user.Email,
            subject: "DTC System — Password Reset Request",
            htmlBody: $"""
                <p>Hi {user.FullName},</p>
                <p>We received a request to reset your DTC System password.</p>
                <p><a href="{resetUrl}" style="background:#1d4ed8;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Reset Password</a></p>
                <p>This link will expire in <strong>1 hour</strong>.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <br><p style="color:#888;font-size:12px;">DTC System &mdash; Developed by MACCOM.ID</p>
            """
        );
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == token &&
            u.PasswordResetTokenExpiry > DateTime.UtcNow);

        if (user is null)
            throw new InvalidOperationException("Reset token is invalid or has expired.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.RefreshToken = null; // Invalidate semua session lama
        await _db.SaveChangesAsync();
    }

}
