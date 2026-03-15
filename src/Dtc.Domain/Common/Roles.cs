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
