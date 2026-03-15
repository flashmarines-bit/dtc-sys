namespace Dtc.Application;

using System.Text.RegularExpressions;

public static class InputSanitizationExtensions
{
    private static readonly Regex HtmlTagPattern =
        new(@"<[^>]*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex SqlInjectionPattern =
        new(@"((SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT))",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>Trim + strip HTML tags dari string input</summary>
    public static string? Sanitize(this string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return input;
        var trimmed = input.Trim();
        var noHtml = HtmlTagPattern.Replace(trimmed, string.Empty);
        return noHtml;
    }

    /// <summary>Sanitize dan batasi panjang string</summary>
    public static string? Sanitize(this string? input, int maxLength)
    {
        var sanitized = input.Sanitize();
        if (sanitized is null) return null;
        return sanitized.Length > maxLength
            ? sanitized[..maxLength]
            : sanitized;
    }

    /// <summary>Cek apakah ada indikasi SQL injection</summary>
    public static bool HasSqlInjectionPattern(this string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return false;
        return SqlInjectionPattern.IsMatch(input);
    }
}
