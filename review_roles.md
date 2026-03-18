]633;E;cat /workspaces/dtc-sys/src/Dtc.Domain/Entities/User.cs;ccee7494-a2ae-4ad2-81b7-1b9544553087]633;Cusing Dtc.Domain.Common;

namespace Dtc.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;

    // Auth tokens
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Vendor-specific fields
    public string? CompanyName { get; set; }
    public string? ContactPhone { get; set; }

    // Navigation
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<WorkflowAction> WorkflowActions { get; set; } = [];
}
namespace Dtc.Domain.Common;

public static class Roles
{
    public const string SysAdmin  = "SysAdmin";
    public const string Admin     = "Admin";
    public const string Validator = "Validator";  // review vendor submissions
    public const string User      = "User";
    public const string Vendor    = "Vendor";     // external vendor

    public static readonly string[] All = [SysAdmin, Admin, Validator, User, Vendor];

    /// <summary>SysAdmin + Admin</summary>
    public const string AdminOrAbove = $"{SysAdmin},{Admin}";

    /// <summary>SysAdmin + Admin + Validator</summary>
    public const string ValidatorOrAbove = $"{SysAdmin},{Admin},{Validator}";

    /// <summary>All internal roles (except Vendor)</summary>
    public const string AnyInternal = $"{SysAdmin},{Admin},{Validator},{User}";

    /// <summary>All roles including Vendor</summary>
    public const string AnyRole = $"{SysAdmin},{Admin},{Validator},{User},{Vendor}";
}
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
namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// List all users (SysAdmin, Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search);
        return Ok(result);
    }

    /// <summary>
    /// Get user by ID (SysAdmin, Admin)
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user is null) return NotFound(new { error = "User not found." });
        return Ok(user);
    }

    /// <summary>
    /// Create new user (SysAdmin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.SysAdmin)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update user (SysAdmin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.SysAdmin)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var user = await _userService.UpdateUserAsync(id, request);
            if (user is null) return NotFound(new { error = "User not found." });
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Soft-delete user (SysAdmin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.SysAdmin)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _userService.DeleteUserAsync(id);
        if (!result) return NotFound(new { error = "User not found." });
        return Ok(new { message = "User deleted." });
    }

    /// <summary>
    /// Change own password (any authenticated user)
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { error = "Invalid token." });

            var result = await _userService.ChangePasswordAsync(userId, request);
            if (!result) return NotFound(new { error = "User not found." });

            return Ok(new { message = "Password changed successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
