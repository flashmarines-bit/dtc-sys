namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class TrackingService : ITrackingService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;
    private static readonly Random _rng = new();

    private static readonly Dictionary<DocumentStatus, string> StatusLabels = new()
    {
        [DocumentStatus.Draft]       = "Draft",
        [DocumentStatus.Submitted]   = "Submitted",
        [DocumentStatus.Received]    = "Received",
        [DocumentStatus.Assigned]    = "Assigned",
        [DocumentStatus.UnderReview] = "Under Review",
        [DocumentStatus.Approved]    = "Approved",
        [DocumentStatus.Returned]    = "Returned",
        [DocumentStatus.Rejected]    = "Rejected",
        [DocumentStatus.Archived]    = "Archived",
    };

    public TrackingService(DtcDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    // ── QR SCAN ──────────────────────────────────────────────────────────

    public async Task<QrScanResultDto?> ScanQrAsync(string qrCode, Guid actingUserId)
    {
        var doc = await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.AssignedToUser)
            .FirstOrDefaultAsync(d => d.QrCode == qrCode);

        if (doc is null) return null;

        var history = await GetHistoryAsync(doc.Id);
        var actions = GetAvailableActions(doc.Status);

        return new QrScanResultDto(
            doc.Id, doc.DocumentNumber, doc.QrCode!,
            doc.Title, doc.VendorName, doc.ReferenceNumber,
            doc.Status, StatusLabels[doc.Status],
            doc.AssignedToUser?.FullName,
            doc.ReceivedAt, doc.AssignedAt,
            actions, history.Take(5).ToList()
        );
    }

    // ── STATE TRANSITIONS ─────────────────────────────────────────────────

    public async Task<DocumentDto> SubmitAsync(Guid documentId, Guid userId, string? notes = null)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);
        AssertStatus(doc, DocumentStatus.Draft);

        return await TransitionAsync(doc, DocumentStatus.Submitted,
            TrackingEvent.Submitted, userId, notes ?? "Document submitted for processing.");
    }

    public async Task<DocumentDto> ReceiveAsync(Guid documentId, Guid userId, ReceiveDocumentRequest request)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);
        AssertStatus(doc, DocumentStatus.Submitted);

        doc.ReceivedAt = DateTime.UtcNow;
        return await TransitionAsync(doc, DocumentStatus.Received,
            TrackingEvent.Received, userId, request.Notes ?? "Document received by front desk.");
    }

    public async Task<DocumentDto> AssignAsync(Guid documentId, Guid userId, AssignDocumentRequest request)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);
        AssertStatus(doc, DocumentStatus.Received);

        var verifier = await _db.Users.FindAsync(request.VerifierUserId)
            ?? throw new ArgumentException("Verifier user not found.");

        doc.AssignedToUserId = request.VerifierUserId;
        doc.AssignedAt = DateTime.UtcNow;

        return await TransitionAsync(doc, DocumentStatus.Assigned,
            TrackingEvent.Assigned, userId,
            request.Notes ?? $"Assigned to {verifier.FullName}.",
            recipientUserId: request.VerifierUserId);
    }

    public async Task<DocumentDto> StartReviewAsync(Guid documentId, Guid userId, string? notes = null)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);
        AssertStatus(doc, DocumentStatus.Assigned);

        doc.ReviewStartedAt = DateTime.UtcNow;
        return await TransitionAsync(doc, DocumentStatus.UnderReview,
            TrackingEvent.ReviewStarted, userId, notes ?? "Review started.");
    }

    public async Task<DocumentDto> ApproveAsync(Guid documentId, Guid userId, string? notes = null)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);
        AssertStatus(doc, DocumentStatus.UnderReview);

        return await TransitionAsync(doc, DocumentStatus.Approved,
            TrackingEvent.Approved, userId, notes ?? "Document approved.");
    }

    public async Task<DocumentDto> ReturnAsync(Guid documentId, Guid userId, ReturnDocumentRequest request)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);
        if (doc.Status != DocumentStatus.UnderReview && doc.Status != DocumentStatus.Assigned)
            throw new InvalidOperationException($"Cannot return document in status: {doc.Status}");

        doc.ReturnReason = request.Reason;
        doc.AssignedToUserId = null;
        doc.AssignedAt = null;

        return await TransitionAsync(doc, DocumentStatus.Returned,
            TrackingEvent.Returned, userId, $"Returned: {request.Reason}");
    }

    // ── HANDOVER OTP ──────────────────────────────────────────────────────

    public async Task<HandoverInitiatedDto> InitiateHandoverAsync(
        Guid documentId, Guid userId, InitiateHandoverRequest request)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);

        var otp = _rng.Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(10);

        var tracking = new DocumentTracking
        {
            DocumentId = documentId,
            Event = TrackingEvent.HandoverInitiated,
            FromStatus = doc.Status,
            ToStatus = doc.Status,
            OtpCode = otp,
            OtpExpiresAt = expiresAt,
            RecipientUserId = request.RecipientUserId,
            ActedByUserId = userId,
            Notes = "Handover initiated, OTP generated.",
            CreatedAt = DateTime.UtcNow
        };

        _db.DocumentTrackings.Add(tracking);
        await _db.SaveChangesAsync();

        return new HandoverInitiatedDto(tracking.Id, otp, expiresAt);
    }

    public async Task<DocumentDto> ConfirmHandoverAsync(
        Guid documentId, Guid userId, ConfirmHandoverRequest request)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);

        var pending = await _db.DocumentTrackings
            .Where(t => t.DocumentId == documentId
                     && t.Event == TrackingEvent.HandoverInitiated
                     && t.OtpConfirmedAt == null
                     && t.OtpExpiresAt > DateTime.UtcNow)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active handover OTP found.");

        if (pending.OtpCode != request.OtpCode)
            throw new InvalidOperationException("Invalid OTP.");

        pending.OtpConfirmedAt = DateTime.UtcNow;
        pending.UpdatedAt = DateTime.UtcNow;

        _db.DocumentTrackings.Add(new DocumentTracking
        {
            DocumentId = documentId,
            Event = TrackingEvent.HandoverConfirmed,
            FromStatus = doc.Status,
            ToStatus = doc.Status,
            ActedByUserId = userId,
            RecipientUserId = pending.RecipientUserId,
            Notes = "Handover confirmed via OTP.",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (await GetDocumentDtoAsync(doc.Id))!;
    }

    public async Task<DocumentDto> UploadPhotoProofAsync(
        Guid documentId, Guid userId, Stream photoStream, string fileName, string contentType)
    {
        var doc = await GetDocumentOrThrowAsync(documentId);

        var path = $"photo-proofs/{documentId}/{DateTime.UtcNow:yyyyMMddHHmmss}_{fileName}";
        await _storage.UploadAsync(path, photoStream, contentType);

        _db.DocumentTrackings.Add(new DocumentTracking
        {
            DocumentId = documentId,
            Event = TrackingEvent.PhotoProofUploaded,
            FromStatus = doc.Status,
            ToStatus = doc.Status,
            ActedByUserId = userId,
            PhotoProofPath = path,
            Notes = "Photo proof uploaded (recipient absent).",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (await GetDocumentDtoAsync(doc.Id))!;
    }

    // ── HISTORY & DASHBOARD ───────────────────────────────────────────────

    public async Task<List<TrackingLogDto>> GetHistoryAsync(Guid documentId)
    {
        return await _db.DocumentTrackings
            .Include(t => t.ActedByUser)
            .Include(t => t.RecipientUser)
            .Where(t => t.DocumentId == documentId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TrackingLogDto(
                t.Id, t.Event, t.Event.ToString(),
                t.FromStatus, t.ToStatus,
                t.Notes,
                t.ActedByUserId, t.ActedByUser != null ? t.ActedByUser.FullName : null,
                t.RecipientUserId, t.RecipientUser != null ? t.RecipientUser.FullName : null,
                t.PhotoProofPath != null,
                t.OtpConfirmedAt != null,
                t.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<TrackingDashboardDto> GetDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var slaOverdue = await GetSlaOverdueAsync();

        return new TrackingDashboardDto(
            ReceivedToday:      await _db.Documents.CountAsync(d => d.ReceivedAt != null && d.ReceivedAt.Value.Date == today),
            PendingAssignment:  await _db.Documents.CountAsync(d => d.Status == DocumentStatus.Received),
            UnderReview:        await _db.Documents.CountAsync(d => d.Status == DocumentStatus.UnderReview),
            ReturnedDocuments:  await _db.Documents.CountAsync(d => d.Status == DocumentStatus.Returned),
            ApprovedToday:      await _db.Documents.CountAsync(d => d.Status == DocumentStatus.Approved && d.UpdatedAt != null && d.UpdatedAt.Value.Date == today),
            SlaOverdue:         slaOverdue.Count
        );
    }

    public async Task<List<SlaOverdueDto>> GetSlaOverdueAsync()
    {
        var slaConfigs = await _db.SlaConfigurations.ToListAsync();
        if (!slaConfigs.Any()) return [];

        var now = DateTime.UtcNow;
        var result = new List<SlaOverdueDto>();

        var activeDocs = await _db.Documents
            .Where(d => d.Status != DocumentStatus.Approved
                     && d.Status != DocumentStatus.Archived
                     && d.Status != DocumentStatus.Rejected)
            .ToListAsync();

        foreach (var doc in activeDocs)
        {
            var sla = slaConfigs.FirstOrDefault(s =>
                s.FromStatus == doc.Status &&
                (s.DocumentTypeId == null || s.DocumentTypeId == doc.DocumentTypeId));

            if (sla == null) continue;

            var stuckSince = doc.Status switch
            {
                DocumentStatus.Submitted   => doc.SubmittedAt ?? doc.CreatedAt,
                DocumentStatus.Received    => doc.ReceivedAt  ?? doc.CreatedAt,
                DocumentStatus.Assigned    => doc.AssignedAt  ?? doc.CreatedAt,
                DocumentStatus.UnderReview => doc.ReviewStartedAt ?? doc.CreatedAt,
                _                          => doc.UpdatedAt   ?? doc.CreatedAt
            };

            var minutesStuck = (int)(now - stuckSince).TotalMinutes;
            if (minutesStuck > sla.MaxDurationMinutes)
            {
                result.Add(new SlaOverdueDto(
                    doc.Id, doc.DocumentNumber, doc.Title, doc.VendorName,
                    doc.Status, StatusLabels[doc.Status],
                    stuckSince, minutesStuck, sla.MaxDurationMinutes
                ));
            }
        }

        return result;
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private async Task<Document> GetDocumentOrThrowAsync(Guid id)
    {
        return await _db.Documents
            .Include(d => d.DocumentType)
            .Include(d => d.CreatedByUser)
            .Include(d => d.OrganizationFunction)
            .Include(d => d.AssignedToUser)
            .FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new ArgumentException("Document not found.");
    }

    private async Task<DocumentDto?> GetDocumentDtoAsync(Guid id)
    {
        var doc = await GetDocumentOrThrowAsync(id);
        return MapToDto(doc);
    }

    private static void AssertStatus(Document doc, DocumentStatus expected)
    {
        if (doc.Status != expected)
            throw new InvalidOperationException(
                $"Expected status {expected}, but document is {doc.Status}.");
    }

    private async Task<DocumentDto> TransitionAsync(
        Document doc, DocumentStatus toStatus, TrackingEvent evt,
        Guid userId, string notes, Guid? recipientUserId = null)
    {
        var fromStatus = doc.Status;
        doc.Status = toStatus;
        doc.UpdatedAt = DateTime.UtcNow;

        _db.DocumentTrackings.Add(new DocumentTracking
        {
            DocumentId = doc.Id,
            Event = evt,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ActedByUserId = userId,
            RecipientUserId = recipientUserId,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return MapToDto(doc);
    }

    private static List<string> GetAvailableActions(DocumentStatus status) => status switch
    {
        DocumentStatus.Draft       => ["submit"],
        DocumentStatus.Submitted   => ["receive"],
        DocumentStatus.Received    => ["assign", "initiate-handover", "upload-photo-proof"],
        DocumentStatus.Assigned    => ["start-review", "return", "initiate-handover"],
        DocumentStatus.UnderReview => ["approve", "return"],
        DocumentStatus.Returned    => ["assign"],
        _                          => []
    };

    private static DocumentDto MapToDto(Document d) => new(
        d.Id, d.DocumentNumber, d.QrCode, d.Title, d.Description,
        d.Status, d.OriginalFileName, d.MimeType, d.FileSizeBytes,
        d.StorageStage, d.DocumentTypeId,
        d.DocumentType.Code, d.DocumentType.Name,
        d.OrganizationFunctionId,
        d.OrganizationFunction?.Code,
        d.OrganizationFunction?.Name,
        d.CreatedByUserId, d.CreatedByUser.FullName,
        d.CreatedAt, d.UpdatedAt
    );
}
