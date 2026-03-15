namespace Dtc.Infrastructure.Services;

using Dtc.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;

/// <summary>
/// Supabase Storage via REST API (no SDK dependency for storage ops).
/// Bucket: dtc-storage (must be created in Supabase dashboard).
/// </summary>
public class SupabaseStorageService : IStorageService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private readonly string _bucket;

    public SupabaseStorageService(IConfiguration config, IHttpClientFactory httpFactory)
    {
        _http = httpFactory.CreateClient("SupabaseStorage");
        var projectUrl = config["Supabase:Url"]
            ?? throw new InvalidOperationException("Supabase:Url not configured.");
        var serviceKey = config["Supabase:ServiceKey"]
            ?? throw new InvalidOperationException("Supabase:ServiceKey not configured.");
        _bucket = config["Supabase:StorageBucket"] ?? "dtc-storage";

        _baseUrl = $"{projectUrl}/storage/v1";
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceKey);
        _http.DefaultRequestHeaders.Add("apikey", serviceKey);
    }

    public async Task<string> UploadAsync(string path, Stream stream, string contentType)
    {
        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var response = await _http.PostAsync(
            $"{_baseUrl}/object/{_bucket}/{path}", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Supabase upload failed: {response.StatusCode} - {error}");
        }

        return path;
    }

    public async Task<Stream> DownloadAsync(string path)
    {
        var response = await _http.GetAsync(
            $"{_baseUrl}/object/{_bucket}/{path}");

        if (!response.IsSuccessStatusCode)
            throw new FileNotFoundException($"File not found in storage: {path}");

        return await response.Content.ReadAsStreamAsync();
    }

    public async Task DeleteAsync(string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete,
            $"{_baseUrl}/object/{_bucket}/{path}");

        await _http.SendAsync(request);
    }

    public Task<string> GetPublicUrlAsync(string path)
    {
        var url = $"{_baseUrl}/object/public/{_bucket}/{path}";
        return Task.FromResult(url);
    }

    public async Task<bool> ExistsAsync(string path)
    {
        try
        {
            var response = await _http.GetAsync(
                $"{_baseUrl}/object/info/{_bucket}/{path}");
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var response = await _http.GetAsync($"{_baseUrl}/bucket/{_bucket}");
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }
}
