namespace Dtc.Application.Interfaces;

using Dtc.Domain.Entities;
using Dtc.Domain.Enums;

public record StateMachineResult(
    bool Success,
    Document? Document,
    string? Error,
    string? NotificationMessage
);

public interface IDocumentStateMachineService
{
    // ── VENDOR ACTIONS ────────────────────────────────────
    /// <summary>Vendor submit dokumen baru</summary>
    Task<StateMachineResult> SubmitAsync(
        Guid documentId, Guid vendorUserId);

    /// <summary>Vendor deklarasi sedang mengantar fisik</summary>
    Task<StateMachineResult> DeclarePreArrivalAsync(
        Guid documentId, Guid vendorUserId);

    /// <summary>Vendor konfirmasi serah terima (dual confirmation)</summary>
    Task<StateMachineResult> VendorConfirmHandoverAsync(
        Guid documentId, Guid vendorUserId);

    // ── FRONT DESK ACTIONS ────────────────────────────────
    /// <summary>Front desk terima fisik dokumen</summary>
    Task<StateMachineResult> FrontDeskReceiveAsync(
        Guid documentId, Guid frontDeskUserId);

    // ── VERIFIKATOR ACTIONS ───────────────────────────────
    /// <summary>Verifikator terima fisik (dual confirmation selesai)</summary>
    Task<StateMachineResult> VerifikatorReceiveAsync(
        Guid documentId, Guid verifikatorUserId);

    /// <summary>Staf titip dokumen di meja + upload foto wajib</summary>
    Task<StateMachineResult> DropOffAsync(
        Guid documentId, Guid dropOffByUserId,
        Guid targetUserId, string photoPath);

    /// <summary>Target konfirmasi terima titipan (SLA mulai)</summary>
    Task<StateMachineResult> AcknowledgeDropOffAsync(
        Guid documentId, Guid targetUserId);

    /// <summary>Ambil alih proses dari verifikator lain</summary>
    Task<StateMachineResult> TakeOverAsync(
        Guid documentId, Guid newVerifikatorUserId);

    /// <summary>Inisiasi pengembalian ke vendor</summary>
    Task<StateMachineResult> InitiateReturnAsync(
        Guid documentId, Guid verifikatorUserId, string reason);

    /// <summary>Verifikasi OTP kurir untuk pickup</summary>
    Task<StateMachineResult> VerifyPickupOtpAsync(
        Guid documentId, Guid verifikatorUserId, string otpCode);

    /// <summary>Approve dokumen</summary>
    Task<StateMachineResult> ApproveAsync(
        Guid documentId, Guid verifikatorUserId, string? notes);

    /// <summary>Reject dokumen</summary>
    Task<StateMachineResult> RejectAsync(
        Guid documentId, Guid verifikatorUserId, string reason);

    // ── QR SCAN HANDLER ───────────────────────────────────
    /// <summary>
    /// Handler utama saat QR di-scan.
    /// Return aksi yang tersedia berdasarkan role + status dokumen.
    /// </summary>
    Task<QrScanResult> HandleQrScanAsync(
        Guid documentId, Guid scannedByUserId, string userRole);
}

public record QrScanResult(
    bool Success,
    string DocumentNumber,
    string Title,
    DocumentStatus CurrentStatus,
    string StatusLabel,
    string? CurrentHolderName,
    List<AvailableAction> AvailableActions,
    string? Message
);

public record AvailableAction(
    string ActionKey,      // e.g. "receive", "dropoff", "approve"
    string Label,          // e.g. "Terima Dokumen"
    string Description,
    bool RequiresPhoto,
    bool RequiresInput,
    string? InputLabel
);
