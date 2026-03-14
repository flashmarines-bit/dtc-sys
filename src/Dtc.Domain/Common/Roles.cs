namespace Dtc.Domain.Common;

public static class Roles
{
    public const string SysAdmin = "SysAdmin";
    public const string Admin = "Admin";
    public const string User = "User";

    public static readonly string[] All = [SysAdmin, Admin, User];

    /// <summary>
    /// SysAdmin + Admin
    /// </summary>
    public const string AdminOrAbove = $"{SysAdmin},{Admin}";

    /// <summary>
    /// All authenticated roles
    /// </summary>
    public const string AnyRole = $"{SysAdmin},{Admin},{User}";
}
