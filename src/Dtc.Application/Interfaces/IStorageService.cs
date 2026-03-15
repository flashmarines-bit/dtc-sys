namespace Dtc.Application.Interfaces;

public interface IStorageService
{
    /// <summary>Upload file, return storage path</summary>
    Task<string> UploadAsync(string path, Stream stream, string contentType);

    /// <summary>Download file sebagai stream</summary>
    Task<Stream> DownloadAsync(string path);

    /// <summary>Hapus file</summary>
    Task DeleteAsync(string path);

    /// <summary>Generate URL untuk akses publik/signed</summary>
    Task<string> GetPublicUrlAsync(string path);

    /// <summary>Cek apakah file exists</summary>
    Task<bool> ExistsAsync(string path);

    /// <summary>Test koneksi ke storage provider</summary>
    Task<bool> TestConnectionAsync();
}
