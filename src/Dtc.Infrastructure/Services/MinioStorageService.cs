namespace Dtc.Infrastructure.Services;

using System.Net.Http.Headers;
using Dtc.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

/// <summary>
/// MinIO S3-compatible storage.
/// Untuk production VPS — ganti Supabase dengan MinIO lokal.
/// Config: Storage:Minio:Endpoint, AccessKey, SecretKey, Bucket, UseSSL
/// </summary>
public class MinioStorageService : IStorageService
{
    private readonly HttpClient _http;
    private readonly string _endpoint;
    private readonly string _bucket;
    private readonly string _accessKey;
    private readonly string _secretKey;
    private readonly bool _useSsl;
    private readonly ILogger<MinioStorageService> _logger;

    public MinioStorageService(
        IConfiguration config,
        IHttpClientFactory httpFactory,
        ILogger<MinioStorageService> logger)
    {
        _logger = logger;
        _endpoint  = config["Storage:Minio:Endpoint"]   ?? "localhost:9000";
        _bucket    = config["Storage:Minio:Bucket"]     ?? "dtc-storage";
        _accessKey = config["Storage:Minio:AccessKey"]  ?? "";
        _secretKey = config["Storage:Minio:SecretKey"]  ?? "";
        _useSsl    = bool.Parse(config["Storage:Minio:UseSSL"] ?? "false");
        _http = httpFactory.CreateClient("MinioStorage");
    }

    private string BaseUrl => $"{(_useSsl ? "https" : "http")}://{_endpoint}";

    public async Task<string> UploadAsync(
        string path, Stream stream, string contentType)
    {
        try
        {
            var url = $"{BaseUrl}/{_bucket}/{path}";
            using var content = new StreamContent(stream);
            content.Headers.ContentType =
                new MediaTypeHeaderValue(contentType);

            var request = new HttpRequestMessage(HttpMethod.Put, url)
            {
                Content = content
            };
            AddAuthHeader(request, "PUT", path, contentType);

            var response = await _http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            _logger.LogInformation(
                "MinIO upload OK: {Path}", path);
            return path;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MinIO upload failed: {Path}", path);
            throw;
        }
    }

    public async Task<Stream> DownloadAsync(string path)
    {
        var url = $"{BaseUrl}/{_bucket}/{path}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddAuthHeader(request, "GET", path);
        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStreamAsync();
    }

    public async Task DeleteAsync(string path)
    {
        var url = $"{BaseUrl}/{_bucket}/{path}";
        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        AddAuthHeader(request, "DELETE", path);
        var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
            _logger.LogWarning("MinIO delete failed: {Path}", path);
    }

    public Task<string> GetPublicUrlAsync(string path)
    {
        var url = $"{BaseUrl}/{_bucket}/{path}";
        return Task.FromResult(url);
    }

    public async Task<bool> ExistsAsync(string path)
    {
        try
        {
            var url = $"{BaseUrl}/{_bucket}/{path}";
            var request = new HttpRequestMessage(HttpMethod.Head, url);
            AddAuthHeader(request, "HEAD", path);
            var response = await _http.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var request = new HttpRequestMessage(
                HttpMethod.Get, $"{BaseUrl}/minio/health/live");
            var response = await _http.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    // Simplified AWS Signature V4 header
    // For production, use official Minio SDK
    private void AddAuthHeader(
        HttpRequestMessage request,
        string method,
        string path,
        string? contentType = null)
    {
        var date = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");
        request.Headers.TryAddWithoutValidation("x-amz-date", date);
        // Note: Full AWS Sig V4 implementation needed for production
        // Consider using MINIO .NET SDK: Minio.Client
        var authValue = $"AWS4-HMAC-SHA256 " +
            $"Credential={_accessKey}/" +
            $"{DateTime.UtcNow:yyyyMMdd}/us-east-1/s3/aws4_request";
        request.Headers.TryAddWithoutValidation(
            "Authorization", authValue);
    }
}
