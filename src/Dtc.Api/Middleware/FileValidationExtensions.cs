namespace Dtc.Api.Middleware;

public static class FileValidationExtensions
{
    private static readonly byte[] PdfMagicBytes = { 0x25, 0x50, 0x44, 0x46 }; // %PDF

    /// <summary>Validasi PDF berdasarkan magic bytes, bukan hanya extension</summary>
    public static async Task<bool> IsPdfAsync(this IFormFile file)
    {
        if (file.Length < 4) return false;

        var buffer = new byte[4];
        using var stream = file.OpenReadStream();
        var bytesRead = await stream.ReadAsync(buffer.AsMemory(0, 4));

        if (bytesRead < 4) return false;

        return buffer[0] == PdfMagicBytes[0]
            && buffer[1] == PdfMagicBytes[1]
            && buffer[2] == PdfMagicBytes[2]
            && buffer[3] == PdfMagicBytes[3];
    }

    /// <summary>Hitung SHA256 hash dari file stream</summary>
    public static async Task<string> ComputeSha256Async(this IFormFile file)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        using var stream = file.OpenReadStream();
        var hashBytes = await sha256.ComputeHashAsync(stream);
        return Convert.ToHexString(hashBytes).ToLower();
    }
}
