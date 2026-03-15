namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class DocumentStateMachineService : IDocumentStateMachineService
{
    private readonly DtcDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<DocumentStateMachineService> _logger;
    private static readonly Random _rng = new();

    public DocumentStateMachineService(
        DtcDbContext db,
        INotificationService notifications,
        ILogger<DocumentStateMachineService> logger)
    {
        _db = db;
        _notifications = notifications;
        _logger = logger;
    }

    // ── VENDOR ACTIONS ────────────────────────────────────────────────────

    public async Task<StateMachineResult> SubmitAsync(
        Guid documentId, Guid vendorUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.Draft)
            return Fail($"Dokumen tidak bisa disubmit dari status {doc.Status}.");

        doc.Status = DocumentStatus.Submitted;
        doc.SubmittedAt = DateTime.UtcNow;

        await AddTrackingAsync(doc, TrackingEvent.Submitted,
            DocumentStatus.Draft, DocumentStatus.Submitted,
            vendorUserId, "Dokumen disubmit oleh vendor.");

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Document {Number} submitted by {UserId}",
            doc.DocumentNumber, vendorUserId);

        return Ok(doc, "Dokumen berhasil disubmit. Silakan antar fisik dokumen.");
    }

    public async Task<StateMachineResult> DeclarePreArrivalAsync(
        Guid documentId, Guid vendorUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.Submitted)
            return Fail("Pre-arrival hanya bisa dideklarasi dari status Submitted.");

        doc.Status = DocumentStatus.PreArrivalDeclared;
        doc.PreArrivalDeclaredAt = DateTime.UtcNow;

        await AddTrackingAsync(doc, TrackingEvent.PreArrivalDeclared,
            DocumentStatus.Submitted, DocumentStatus.PreArrivalDeclared,
            vendorUserId, "Vendor mendeklarasi sedang dalam perjalanan mengantar fisik.");

        await _db.SaveChangesAsync();

        // Broadcast ke semua verifikator + tim terkait
        await _notifications.BroadcastToRoleAsync("Validator", new NotificationRequest
        {
            Title = "📦 Dokumen Dalam Perjalanan",
            Message = $"Vendor sedang mengantar fisik dokumen {doc.DocumentNumber} — {doc.Title}. " +
                     $"Harap siapkan penerimaan.",
            Type = NotificationType.PreArrivalDeclared,
            Priority = NotificationPriority.High,
            EntityType = "Document",
            EntityId = documentId,
            ActionUrl = $"/documents/{documentId}/scan"
        });

        // Juga broadcast ke FrontDesk role
        await _notifications.BroadcastToRoleAsync("FrontDesk", new NotificationRequest
        {
            Title = "📦 Dokumen Akan Tiba di Lobi",
            Message = $"Vendor akan tiba membawa {doc.DocumentNumber}. Siapkan penerimaan.",
            Type = NotificationType.PreArrivalDeclared,
            Priority = NotificationPriority.High,
            EntityType = "Document",
            EntityId = documentId,
            ActionUrl = $"/documents/{documentId}/scan"
        });

        _logger.LogInformation(
            "Pre-arrival declared for {Number}", doc.DocumentNumber);

        return Ok(doc, "Pre-arrival dideklarasi. Tim internal sudah dinotifikasi.");
    }

    public async Task<StateMachineResult> VendorConfirmHandoverAsync(
        Guid documentId, Guid vendorUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.PendingDualConfirmation)
            return Fail("Tidak ada handover yang menunggu konfirmasi vendor.");

        // Cek apakah verifikator sudah konfirmasi lebih dulu
        var verifikatorConfirmed = await _db.DocumentTrackings
            .AnyAsync(t => t.DocumentId == documentId
                        && t.Event == TrackingEvent.DualConfirmationVerif);

        doc.Status = DocumentStatus.ReceivedByVerifikator;
        doc.VerifikatorReceivedAt = DateTime.UtcNow;
        doc.SlaStartedAt = DateTime.UtcNow;

        await AddTrackingAsync(doc, TrackingEvent.DualConfirmationVendor,
            DocumentStatus.PendingDualConfirmation,
            DocumentStatus.ReceivedByVerifikator,
            vendorUserId, "Vendor mengkonfirmasi serah terima. Dual confirmation selesai.");

        await _db.SaveChangesAsync();

        // Notif ke verifikator bahwa SLA sudah mulai
        if (doc.CurrentHolderId.HasValue)
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = doc.CurrentHolderId.Value,
                Title = "✅ Serah Terima Dikonfirmasi",
                Message = $"Vendor mengkonfirmasi serah terima {doc.DocumentNumber}. " +
                         $"SLA mulai berjalan.",
                Type = NotificationType.DualConfirmationComplete,
                Priority = NotificationPriority.Normal,
                EntityType = "Document",
                EntityId = documentId
            });
        }

        return Ok(doc, "Serah terima dikonfirmasi. SLA mulai berjalan.");
    }

    // ── FRONT DESK ACTIONS ────────────────────────────────────────────────

    public async Task<StateMachineResult> FrontDeskReceiveAsync(
        Guid documentId, Guid frontDeskUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");

        var allowed = new[]
        {
            DocumentStatus.PreArrivalDeclared,
            DocumentStatus.Submitted
        };
        if (!allowed.Contains(doc.Status))
            return Fail($"Dokumen tidak bisa diterima front desk dari status {doc.Status}.");

        doc.Status = DocumentStatus.ReceivedAtFrontDesk;
        doc.FrontDeskReceivedAt = DateTime.UtcNow;
        doc.CurrentHolderId = frontDeskUserId;

        await AddTrackingAsync(doc, TrackingEvent.ReceivedAtFrontDesk,
            doc.Status, DocumentStatus.ReceivedAtFrontDesk,
            frontDeskUserId, "Diterima di front desk / lobi.");

        await _db.SaveChangesAsync();

        // Notif ke target department / verifikator
        if (!string.IsNullOrEmpty(doc.AssignedToUserId?.ToString()))
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = doc.AssignedToUserId!.Value,
                Title = "📬 Dokumen Ada di Lobi",
                Message = $"Dokumen {doc.DocumentNumber} sudah diterima di lobi. " +
                         $"Harap segera diambil atau dijemput.",
                Type = NotificationType.DocumentReceivedFrontDesk,
                Priority = NotificationPriority.High,
                EntityType = "Document",
                EntityId = documentId,
                ActionUrl = $"/documents/{documentId}/scan"
            });
        }

        // Broadcast ke Validator role
        await _notifications.BroadcastToRoleAsync("Validator", new NotificationRequest
        {
            Title = "📬 Dokumen di Lobi",
            Message = $"{doc.DocumentNumber} sudah ada di lobi. Ada dokumen untuk tim Anda?",
            Type = NotificationType.DocumentReceivedFrontDesk,
            Priority = NotificationPriority.Normal,
            EntityType = "Document",
            EntityId = documentId
        });

        return Ok(doc, "Dokumen diterima di front desk. Tim verifikator sudah dinotifikasi.");
    }

    // ── VERIFIKATOR ACTIONS ───────────────────────────────────────────────

    public async Task<StateMachineResult> VerifikatorReceiveAsync(
        Guid documentId, Guid verifikatorUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");

        var allowed = new[]
        {
            DocumentStatus.ReceivedAtFrontDesk,
            DocumentStatus.InTransitInternal,
            DocumentStatus.PreArrivalDeclared,
            DocumentStatus.Submitted
        };
        if (!allowed.Contains(doc.Status))
            return Fail($"Tidak bisa terima dari status {doc.Status}.");

        var prevStatus = doc.Status;
        doc.Status = DocumentStatus.PendingDualConfirmation;
        doc.CurrentHolderId = verifikatorUserId;

        await AddTrackingAsync(doc, TrackingEvent.DualConfirmationVerif,
            prevStatus, DocumentStatus.PendingDualConfirmation,
            verifikatorUserId,
            "Verifikator menerima fisik. Menunggu konfirmasi vendor.");

        await _db.SaveChangesAsync();

        // Notif ke vendor untuk konfirmasi
        var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
        if (vendor != null)
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = vendor.Id,
                Email = vendor.Email,
                Title = "✋ Konfirmasi Serah Terima",
                Message = $"Verifikator sudah menerima fisik dokumen {doc.DocumentNumber}. " +
                         $"Silakan konfirmasi serah terima.",
                Type = NotificationType.DualConfirmationRequired,
                Priority = NotificationPriority.High,
                EntityType = "Document",
                EntityId = documentId,
                ActionUrl = $"/vendor/documents/{documentId}/confirm-handover"
            });
        }

        return Ok(doc, "Penerimaan dicatat. Menunggu konfirmasi vendor untuk dual confirmation.");
    }

    public async Task<StateMachineResult> DropOffAsync(
        Guid documentId, Guid dropOffByUserId,
        Guid targetUserId, string photoPath)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");

        if (string.IsNullOrEmpty(photoPath))
            return Fail("Foto bukti drop-off wajib diupload.");

        var prevStatus = doc.Status;
        doc.Status = DocumentStatus.DroppedOffPendingAck;
        doc.DropOffAt = DateTime.UtcNow;
        doc.DropOffPhotoPath = photoPath;
        doc.DropOffByUserId = dropOffByUserId;
        doc.AssignedToUserId = targetUserId;

        await AddTrackingAsync(doc, TrackingEvent.DropOffPhotoUploaded,
            prevStatus, DocumentStatus.DroppedOffPendingAck,
            dropOffByUserId,
            "Dokumen dititipkan di meja target. Foto bukti diupload.",
            photoPath: photoPath,
            requiresAck: true);

        await _db.SaveChangesAsync();

        // Notif ke target user (Budi) — wajib konfirmasi
        var dropper = await _db.Users.FindAsync(dropOffByUserId);
        await _notifications.SendAsync(new NotificationRequest
        {
            UserId = targetUserId,
            Title = "📋 Ada Dokumen di Meja Anda",
            Message = $"{dropper?.FullName ?? "Rekan Anda"} menitipkan dokumen " +
                     $"{doc.DocumentNumber} di meja Anda. " +
                     $"Harap konfirmasi penerimaan.",
            Type = NotificationType.DropOffPhotoUploaded,
            Priority = NotificationPriority.High,
            EntityType = "Document",
            EntityId = documentId,
            ActionUrl = $"/documents/{documentId}/scan"
        });

        return Ok(doc, $"Dokumen dititipkan. Notifikasi dikirim ke target. Harap konfirmasi penerimaan.");
    }

    public async Task<StateMachineResult> AcknowledgeDropOffAsync(
        Guid documentId, Guid targetUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.DroppedOffPendingAck)
            return Fail("Tidak ada drop-off yang menunggu konfirmasi.");
        if (doc.AssignedToUserId != targetUserId)
            return Fail("Anda bukan target penerima dokumen ini.");

        doc.Status = DocumentStatus.ReceivedByVerifikator;
        doc.DropOffAcknowledgedAt = DateTime.UtcNow;
        doc.VerifikatorReceivedAt = DateTime.UtcNow;
        doc.CurrentHolderId = targetUserId;
        doc.SlaStartedAt = DateTime.UtcNow; // SLA baru mulai saat Budi konfirmasi

        await AddTrackingAsync(doc, TrackingEvent.DropOffAcknowledged,
            DocumentStatus.DroppedOffPendingAck,
            DocumentStatus.ReceivedByVerifikator,
            targetUserId, "Target mengkonfirmasi penerimaan titipan. SLA mulai berjalan.");

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Drop-off acknowledged for {Number} by {UserId}. SLA started.",
            doc.DocumentNumber, targetUserId);

        return Ok(doc, "Penerimaan dikonfirmasi. SLA mulai berjalan.");
    }

    public async Task<StateMachineResult> TakeOverAsync(
        Guid documentId, Guid newVerifikatorUserId)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");

        var allowed = new[]
        {
            DocumentStatus.ReceivedByVerifikator,
            DocumentStatus.InReview,
            DocumentStatus.PendingDualConfirmation
        };
        if (!allowed.Contains(doc.Status))
            return Fail($"Tidak bisa take over dari status {doc.Status}.");

        var prevHolder = doc.CurrentHolderId;
        doc.CurrentHolderId = newVerifikatorUserId;
        doc.AssignedToUserId = newVerifikatorUserId;

        await AddTrackingAsync(doc, TrackingEvent.TakeOver,
            doc.Status, doc.Status,
            newVerifikatorUserId,
            $"Take over dari user {prevHolder}.");

        await _db.SaveChangesAsync();

        // Notif ke pemegang lama
        if (prevHolder.HasValue)
        {
            var newVerif = await _db.Users.FindAsync(newVerifikatorUserId);
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = prevHolder.Value,
                Title = "🔄 Dokumen Diambil Alih",
                Message = $"{newVerif?.FullName ?? "Rekan"} mengambil alih proses " +
                         $"dokumen {doc.DocumentNumber}.",
                Type = NotificationType.TakeOverNotification,
                Priority = NotificationPriority.Normal,
                EntityType = "Document",
                EntityId = documentId
            });
        }

        return Ok(doc, "Take over berhasil.");
    }

    public async Task<StateMachineResult> InitiateReturnAsync(
        Guid documentId, Guid verifikatorUserId, string reason)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");

        var allowed = new[]
        {
            DocumentStatus.InReview,
            DocumentStatus.ReceivedByVerifikator
        };
        if (!allowed.Contains(doc.Status))
            return Fail($"Tidak bisa return dari status {doc.Status}.");

        // Generate OTP untuk pickup
        var otp = _rng.Next(100000, 999999).ToString();
        var otpExpiry = DateTime.UtcNow.AddHours(24);

        doc.Status = DocumentStatus.WaitingPickupConfirmation;
        doc.ReturnInitiatedAt = DateTime.UtcNow;
        doc.ReturnReason = reason;
        doc.PickupOtpCode = otp;
        doc.PickupOtpExpiresAt = otpExpiry;

        await AddTrackingAsync(doc, TrackingEvent.ReturnInitiated,
            doc.Status, DocumentStatus.WaitingPickupConfirmation,
            verifikatorUserId, $"Return diinisiasi. Alasan: {reason}");

        await AddTrackingAsync(doc, TrackingEvent.OtpGenerated,
            DocumentStatus.WaitingPickupConfirmation,
            DocumentStatus.WaitingPickupConfirmation,
            verifikatorUserId, $"OTP pickup dibuat: {otp}");

        await _db.SaveChangesAsync();

        // Kirim OTP ke vendor via Email + WA
        var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
        if (vendor != null)
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = vendor.Id,
                Email = vendor.Email,
                Phone = doc.VendorContactPhone,
                Title = "📦 Dokumen Siap Diambil",
                Message = $"Dokumen {doc.DocumentNumber} dikembalikan. " +
                         $"Alasan: {reason}. " +
                         $"PIN Pengambilan: {otp} (berlaku 24 jam). " +
                         $"Berikan PIN ini ke kurir Anda.",
                Type = NotificationType.OtpPickupGenerated,
                Priority = NotificationPriority.High,
                EntityType = "Document",
                EntityId = documentId
            });
        }

        return Ok(doc, $"Return diinisiasi. OTP [{otp}] dikirim ke vendor. Berlaku 24 jam.");
    }

    public async Task<StateMachineResult> VerifyPickupOtpAsync(
        Guid documentId, Guid verifikatorUserId, string otpCode)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.WaitingPickupConfirmation)
            return Fail("Tidak ada pickup yang menunggu konfirmasi.");

        if (doc.PickupOtpCode != otpCode)
            return Fail("OTP tidak valid.");
        if (doc.PickupOtpExpiresAt < DateTime.UtcNow)
            return Fail("OTP sudah kadaluarsa. Vendor perlu request OTP baru.");

        doc.Status = DocumentStatus.ReturnedToVendor;
        doc.ReturnCompletedAt = DateTime.UtcNow;
        doc.PickupOtpVerifiedAt = DateTime.UtcNow;
        doc.PickupVerifiedByUserId = verifikatorUserId;
        doc.CurrentHolderId = null; // Tidak ada yang pegang lagi

        await AddTrackingAsync(doc, TrackingEvent.OtpVerified,
            DocumentStatus.WaitingPickupConfirmation,
            DocumentStatus.ReturnedToVendor,
            verifikatorUserId, $"OTP diverifikasi. Fisik diserahkan ke kurir/vendor.");

        await _db.SaveChangesAsync();

        // Notif ke vendor
        var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
        if (vendor != null)
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = vendor.Id,
                Email = vendor.Email,
                Title = "✅ Dokumen Sudah Diambil",
                Message = $"Dokumen {doc.DocumentNumber} sudah diserahkan ke kurir/Anda. " +
                         $"Harap perbaiki dan ajukan kembali.",
                Type = NotificationType.DocumentReturnedToVendor,
                Priority = NotificationPriority.Normal,
                EntityType = "Document",
                EntityId = documentId
            });
        }

        return Ok(doc, "OTP valid. Fisik diserahkan. Dokumen dikembalikan ke vendor.");
    }

    public async Task<StateMachineResult> ApproveAsync(
        Guid documentId, Guid verifikatorUserId, string? notes)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.InReview)
            return Fail("Dokumen harus dalam status InReview untuk diapprove.");

        doc.Status = DocumentStatus.Approved;

        await AddTrackingAsync(doc, TrackingEvent.Approved,
            DocumentStatus.InReview, DocumentStatus.Approved,
            verifikatorUserId, notes ?? "Dokumen disetujui.");

        await _db.SaveChangesAsync();

        // Notif ke vendor
        var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
        if (vendor != null)
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = vendor.Id,
                Email = vendor.Email,
                Title = "🎉 Dokumen Disetujui",
                Message = $"Dokumen {doc.DocumentNumber} telah disetujui. " +
                         (notes != null ? $"Catatan: {notes}" : ""),
                Type = NotificationType.DocumentCompleted,
                Priority = NotificationPriority.Normal,
                EntityType = "Document",
                EntityId = documentId
            });
        }

        return Ok(doc, "Dokumen disetujui.");
    }

    public async Task<StateMachineResult> RejectAsync(
        Guid documentId, Guid verifikatorUserId, string reason)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null) return Fail("Dokumen tidak ditemukan.");
        if (doc.Status != DocumentStatus.InReview)
            return Fail("Dokumen harus dalam status InReview untuk ditolak.");

        doc.Status = DocumentStatus.Rejected;
        doc.ReturnReason = reason;

        await AddTrackingAsync(doc, TrackingEvent.Rejected,
            DocumentStatus.InReview, DocumentStatus.Rejected,
            verifikatorUserId, $"Ditolak: {reason}");

        await _db.SaveChangesAsync();

        var vendor = await _db.Users.FindAsync(doc.CreatedByUserId);
        if (vendor != null)
        {
            await _notifications.SendAsync(new NotificationRequest
            {
                UserId = vendor.Id,
                Email = vendor.Email,
                Title = "❌ Dokumen Ditolak",
                Message = $"Dokumen {doc.DocumentNumber} ditolak. Alasan: {reason}",
                Type = NotificationType.DocumentCompleted,
                Priority = NotificationPriority.High,
                EntityType = "Document",
                EntityId = documentId
            });
        }

        return Ok(doc, $"Dokumen ditolak. Alasan: {reason}");
    }

    // ── QR SCAN HANDLER ───────────────────────────────────────────────────

    public async Task<QrScanResult> HandleQrScanAsync(
        Guid documentId, Guid scannedByUserId, string userRole)
    {
        var doc = await GetDocAsync(documentId);
        if (doc is null)
            return new QrScanResult(false, "", "", DocumentStatus.Draft,
                "Unknown", null, [], "Dokumen tidak ditemukan.");

        var holder = doc.CurrentHolderId.HasValue
            ? await _db.Users.FindAsync(doc.CurrentHolderId.Value)
            : null;

        var actions = GetAvailableActions(doc.Status, userRole, scannedByUserId, doc);

        return new QrScanResult(
            Success: true,
            DocumentNumber: doc.DocumentNumber,
            Title: doc.Title,
            CurrentStatus: doc.Status,
            StatusLabel: GetStatusLabel(doc.Status),
            CurrentHolderName: holder?.FullName,
            AvailableActions: actions,
            Message: null
        );
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private async Task<Document?> GetDocAsync(Guid id) =>
        await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.AssignedToUser)
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

    private async Task AddTrackingAsync(
        Document doc, TrackingEvent evt,
        DocumentStatus from, DocumentStatus to,
        Guid actedBy, string notes,
        string? photoPath = null,
        bool requiresAck = false)
    {
        _db.DocumentTrackings.Add(new DocumentTracking
        {
            Id = Guid.NewGuid(),
            DocumentId = doc.Id,
            Event = evt,
            FromStatus = from,
            ToStatus = to,
            ActedByUserId = actedBy,
            Notes = notes,
            PhotoPath = photoPath,
            RequiresAck = requiresAck,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static string GetStatusLabel(DocumentStatus status) => status switch
    {
        DocumentStatus.Draft                     => "Draft",
        DocumentStatus.Submitted                 => "Diajukan",
        DocumentStatus.PreArrivalDeclared        => "Sedang Diantar",
        DocumentStatus.ReceivedAtFrontDesk       => "Di Front Desk",
        DocumentStatus.InTransitInternal         => "Dalam Perjalanan Internal",
        DocumentStatus.PendingDualConfirmation   => "Menunggu Konfirmasi Dual",
        DocumentStatus.ReceivedByVerifikator     => "Diterima Verifikator",
        DocumentStatus.DroppedOffPendingAck      => "Dititip — Menunggu Konfirmasi",
        DocumentStatus.InReview                  => "Sedang Direview",
        DocumentStatus.ReturnInitiated           => "Pengembalian Dimulai",
        DocumentStatus.WaitingPickupConfirmation => "Menunggu Pickup OTP",
        DocumentStatus.ReturnedToVendor          => "Dikembalikan ke Vendor",
        DocumentStatus.Approved                  => "Disetujui ✅",
        DocumentStatus.Rejected                  => "Ditolak ❌",
        DocumentStatus.Archived                  => "Diarsipkan",
        _                                        => status.ToString()
    };

    private static List<AvailableAction> GetAvailableActions(
        DocumentStatus status, string role, Guid userId, Document doc)
    {
        var actions = new List<AvailableAction>();

        switch (status)
        {
            case DocumentStatus.Submitted:
            case DocumentStatus.PreArrivalDeclared:
                if (role is "FrontDesk" or "Validator" or "Admin" or "SysAdmin")
                    actions.Add(new AvailableAction(
                        "frontdesk-receive", "Terima di Front Desk",
                        "Konfirmasi dokumen diterima di lobi/front desk",
                        false, false, null));
                if (role is "Vendor")
                    actions.Add(new AvailableAction(
                        "declare-pre-arrival", "Saya Sedang Mengantar",
                        "Beritahu tim bahwa Anda sedang dalam perjalanan",
                        false, false, null));
                break;

            case DocumentStatus.ReceivedAtFrontDesk:
            case DocumentStatus.InTransitInternal:
                if (role is "Validator" or "Admin" or "SysAdmin")
                {
                    actions.Add(new AvailableAction(
                        "verifikator-receive", "Terima Dokumen",
                        "Konfirmasi dokumen diterima oleh verifikator",
                        false, false, null));
                    actions.Add(new AvailableAction(
                        "dropoff", "Titip di Meja",
                        "Titipkan dokumen di meja verifikator lain (wajib foto)",
                        true, true, "Pilih target penerima"));
                }
                break;

            case DocumentStatus.PendingDualConfirmation:
                if (role is "Vendor")
                    actions.Add(new AvailableAction(
                        "vendor-confirm", "Konfirmasi Serah Terima",
                        "Setujui bahwa dokumen sudah diserahkan ke verifikator",
                        false, false, null));
                break;

            case DocumentStatus.DroppedOffPendingAck:
                if (doc.AssignedToUserId == userId)
                    actions.Add(new AvailableAction(
                        "acknowledge-dropoff", "Konfirmasi Terima Titipan",
                        "Saya sudah melihat dan menerima dokumen yang dititipkan",
                        false, false, null));
                break;

            case DocumentStatus.ReceivedByVerifikator:
                if (role is "Validator" or "Admin" or "SysAdmin")
                {
                    actions.Add(new AvailableAction(
                        "start-review", "Mulai Review",
                        "Mulai proses review dokumen",
                        false, false, null));
                    actions.Add(new AvailableAction(
                        "takeover", "Ambil Alih",
                        "Ambil alih proses dari verifikator yang ditugaskan",
                        false, false, null));
                    actions.Add(new AvailableAction(
                        "dropoff", "Titip di Meja",
                        "Titipkan ke verifikator lain (wajib foto)",
                        true, true, "Pilih target penerima"));
                }
                break;

            case DocumentStatus.InReview:
                if (role is "Validator" or "Admin" or "SysAdmin")
                {
                    actions.Add(new AvailableAction(
                        "approve", "Setujui",
                        "Setujui dokumen", false, true, "Catatan (opsional)"));
                    actions.Add(new AvailableAction(
                        "initiate-return", "Kembalikan ke Vendor",
                        "Kembalikan fisik ke vendor (wajib isi alasan)",
                        false, true, "Alasan pengembalian"));
                }
                break;

            case DocumentStatus.WaitingPickupConfirmation:
                if (role is "Validator" or "Admin" or "SysAdmin")
                    actions.Add(new AvailableAction(
                        "verify-otp", "Verifikasi OTP Kurir",
                        "Masukkan PIN yang diberikan kurir/vendor",
                        false, true, "Masukkan 6-digit PIN"));
                break;
        }

        return actions;
    }

    private static StateMachineResult Ok(Document doc, string message) =>
        new(true, doc, null, message);

    private static StateMachineResult Fail(string error) =>
        new(false, null, error, null);
}
