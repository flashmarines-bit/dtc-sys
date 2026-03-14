namespace Dtc.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(string path, Stream stream, string contentType);
    Task<Stream> DownloadAsync(string path);
    Task DeleteAsync(string path);
}
