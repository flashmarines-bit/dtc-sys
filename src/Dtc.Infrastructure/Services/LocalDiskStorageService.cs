namespace Dtc.Infrastructure.Services;

using Dtc.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

/// <summary>
/// Local disk storage — untuk server lokal tanpa cloud.
/// Config: Storage:Local:BasePath (default: /var/dtc/storage)
/// Files served via API endpoint atau Nginx static files.
/// </summary>
public class LocalDiskStorageService : IStorageService
{
    private readonly string _basePath;
    private readonly ILogger<LocalDiskStorageService> _logger;

    public LocalDiskStorageService(
        IConfiguration config,
        ILogger<LocalDiskStorageService> logger)
    {
        _logger = logger;
        _basePath = config["Storage:Local:BasePath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "storage");
        Directory.CreateDirectory(_basePath);
        _logger.LogInformation(
            "LocalDisk storage initialized at: {Path}", _basePath);
    }

    public async Task<string> UploadAsync(
        string path, Stream stream, string contentType)
    {
        var fullPath = GetFullPath(path);
        var dir = Path.GetDirectoryName(fullPath)!;
        Directory.CreateDirectory(dir);

        using var fileStream = new FileStream(
            fullPath, FileMode.Create, FileAccess.Write);
        await stream.CopyToAsync(fileStream);

        _logger.LogInformation("LocalDisk upload OK: {Path}", path);
        return path;
    }

    public async Task<Stream> DownloadAsync(string path)
    {
        var fullPath = GetFullPath(path);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"File not found: {path}");

        var ms = new MemoryStream();
        using var fileStream = new FileStream(
            fullPath, FileMode.Open, FileAccess.Read);
        await fileStream.CopyToAsync(ms);
        ms.Position = 0;
        return ms;
    }

    public Task DeleteAsync(string path)
    {
        var fullPath = GetFullPath(path);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            _logger.LogInformation("LocalDisk delete OK: {Path}", path);
        }
        return Task.CompletedTask;
    }

    public Task<string> GetPublicUrlAsync(string path)
    {
        // Served via API: /api/files/{path}
        // atau Nginx static: /storage/{path}
        var url = $"/api/files/{path}";
        return Task.FromResult(url);
    }

    public Task<bool> ExistsAsync(string path)
    {
        var fullPath = GetFullPath(path);
        return Task.FromResult(File.Exists(fullPath));
    }

    public Task<bool> TestConnectionAsync()
    {
        try
        {
            Directory.CreateDirectory(_basePath);
            var testFile = Path.Combine(_basePath, ".health");
            File.WriteAllText(testFile, "ok");
            File.Delete(testFile);
            return Task.FromResult(true);
        }
        catch { return Task.FromResult(false); }
    }

    private string GetFullPath(string path) =>
        Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));
}
