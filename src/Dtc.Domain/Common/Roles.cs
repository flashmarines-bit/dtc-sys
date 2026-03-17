namespace Dtc.Domain.Common;

public static class Roles
{
    public const string SysAdmin    = "SysAdmin";
    public const string Admin       = "Admin";
    public const string Validator   = "Validator";    // review vendor submissions (Modul 3)
    public const string Verificator = "Verificator";  // verifikasi dokumen fisik (Modul 1)
    public const string User        = "User";
    public const string Vendor      = "Vendor";       // external vendor

    public static readonly string[] All = [SysAdmin, Admin, Validator, Verificator, User, Vendor];

    /// <summary>SysAdmin + Admin</summary>
    public const string AdminOrAbove = $"{SysAdmin},{Admin}";

    /// <summary>SysAdmin + Admin + Validator</summary>
    public const string ValidatorOrAbove = $"{SysAdmin},{Admin},{Validator}";

    /// <summary>SysAdmin + Admin + Verificator</summary>
    public const string VerificatorOrAbove = $"{SysAdmin},{Admin},{Verificator}";

    /// <summary>All internal roles (except Vendor)</summary>
    public const string AnyInternal = $"{SysAdmin},{Admin},{Validator},{Verificator},{User}";

    /// <summary>All roles including Vendor</summary>
    public const string AnyRole = $"{SysAdmin},{Admin},{Validator},{Verificator},{User},{Vendor}";
}
