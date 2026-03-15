namespace Dtc.Infrastructure.Services;

using System.Text.Json;
using Dtc.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class OcrService : IOcrService
{
    private readonly HttpClient _http;
    private readonly ILogger<OcrService> _logger;

    public OcrService(IHttpClientFactory factory, IConfiguration config, ILogger<OcrService> logger)
    {
        _http = factory.CreateClient("OcrService");
        var baseUrl = config["OcrService:BaseUrl"] ?? "http://localhost:8000";
        _http.BaseAddress = new Uri(baseUrl);
        _http.Timeout = TimeSpan.FromMinutes(20);
        _logger = logger;
    }

    public async Task<OcrAnalysisResult> AnalyzeAsync(Stream pdfStream, string fileName)
    {
        try
        {
            using var content = new MultipartFormDataContent();
            using var streamContent = new StreamContent(pdfStream);
            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
            content.Add(streamContent, "file", fileName);

            _logger.LogInformation("Sending PDF to OCR service: {FileName}", fileName);
            var response = await _http.PostAsync("/analyze", content);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("OCR service error: {Status} {Body}", response.StatusCode, json);
                return new OcrAnalysisResult(false, null, null, null, "Invalid", 0,
                    $"OCR service error: {response.StatusCode}", 0, 0, 0, 0, false, null, json);
            }

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return new OcrAnalysisResult(
                Success:            root.GetProperty("success").GetBoolean(),
                DocumentType:       root.TryGetProperty("document_type", out var dt) ? dt.GetString() : null,
                ExtractedFieldsJson: root.TryGetProperty("extracted_fields", out var ef) ? ef.GetRawText() : null,
                DetectedSignatory:  root.TryGetProperty("detected_signatory", out var ds) ? ds.GetString() : null,
                Grade:              root.TryGetProperty("grade", out var g) ? g.GetString() ?? "Unknown" : "Unknown",
                AiScore:            root.TryGetProperty("ai_score", out var sc) ? sc.GetInt32() : 0,
                AiSummary:          root.TryGetProperty("ai_summary", out var sm) ? sm.GetString() ?? "" : "",
                AvgOcrConfidence:   root.TryGetProperty("avg_ocr_confidence", out var cf) ? (float)cf.GetDouble() : 0,
                TotalPages:         root.TryGetProperty("total_pages", out var tp) ? tp.GetInt32() : 0,
                PagesAnalyzed:      root.TryGetProperty("pages_analyzed", out var pa) ? pa.GetInt32() : 0,
                DetectedDpi:        root.TryGetProperty("dpi_check", out var dpi) ? dpi.GetProperty("dpi").GetInt32() : 0,
                DpiPass:            root.TryGetProperty("dpi_check", out var dpi2) && dpi2.GetProperty("pass").GetBoolean(),
                SearchablePdfBase64: root.TryGetProperty("searchable_pdf_base64", out var spdf) ? spdf.GetString() : null,
                ErrorMessage:       null
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OCR analysis failed for {FileName}", fileName);
            return new OcrAnalysisResult(false, null, null, null, "Invalid", 0,
                "Analysis failed", 0, 0, 0, 0, false, null, ex.Message);
        }
    }

    public async Task<(int dpi, bool pass)> CheckDpiAsync(Stream pdfStream, string fileName)
    {
        try
        {
            using var content = new MultipartFormDataContent();
            using var streamContent = new StreamContent(pdfStream);
            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
            content.Add(streamContent, "file", fileName);

            var response = await _http.PostAsync("/check-dpi", content);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var dpi = root.GetProperty("dpi").GetInt32();
            var pass = root.GetProperty("pass").GetBoolean();
            return (dpi, pass);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DPI check failed for {FileName}", fileName);
            return (0, false);
        }
    }
}
