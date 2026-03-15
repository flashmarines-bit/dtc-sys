namespace Dtc.Application.Interfaces;

public record OcrAnalysisResult(
    bool Success,
    string? DocumentType,
    string? ExtractedFieldsJson,
    string? DetectedSignatory,
    string Grade,
    int AiScore,
    string AiSummary,
    float AvgOcrConfidence,
    int TotalPages,
    int PagesAnalyzed,
    int DetectedDpi,
    bool DpiPass,
    string? SearchablePdfBase64,
    string? ErrorMessage
);

public interface IOcrService
{
    Task<OcrAnalysisResult> AnalyzeAsync(Stream pdfStream, string fileName);
    Task<(int dpi, bool pass)> CheckDpiAsync(Stream pdfStream, string fileName);
}
