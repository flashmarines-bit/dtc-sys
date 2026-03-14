namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface ITrackingService
{
    // QR Scan
    Task<QrScanResultDto?> ScanQrAsync(string qrCode, Guid actingUserId);

    // State transitions
    Task<DocumentDto> SubmitAsync(Guid documentId, Guid userId, string? notes = null);
    Task<DocumentDto> ReceiveAsync(Guid documentId, Guid userId, ReceiveDocumentRequest request);
    Task<DocumentDto> AssignAsync(Guid documentId, Guid userId, AssignDocumentRequest request);
    Task<DocumentDto> StartReviewAsync(Guid documentId, Guid userId, string? notes = null);
    Task<DocumentDto> ApproveAsync(Guid documentId, Guid userId, string? notes = null);
    Task<DocumentDto> ReturnAsync(Guid documentId, Guid userId, ReturnDocumentRequest request);

    // Handover OTP
    Task<HandoverInitiatedDto> InitiateHandoverAsync(Guid documentId, Guid userId, InitiateHandoverRequest request);
    Task<DocumentDto> ConfirmHandoverAsync(Guid documentId, Guid userId, ConfirmHandoverRequest request);
    Task<DocumentDto> UploadPhotoProofAsync(Guid documentId, Guid userId, Stream photoStream, string fileName, string contentType);

    // History & Dashboard
    Task<List<TrackingLogDto>> GetHistoryAsync(Guid documentId);
    Task<TrackingDashboardDto> GetDashboardAsync();
    Task<List<SlaOverdueDto>> GetSlaOverdueAsync();
}
