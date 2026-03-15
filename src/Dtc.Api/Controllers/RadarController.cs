namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

[ApiController]
[Route("api/radar")]
[Authorize]
public class RadarController : ControllerBase
{
    private readonly DtcDbContext _db;

    public RadarController(DtcDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value!);

    private string GetRole() =>
        User.FindFirst(ClaimTypes.Role)?.Value
        ?? User.FindFirst("role")?.Value ?? "";

    /// <summary>Radar dashboard — data per role</summary>
    [HttpGet]
    public async Task<IActionResult> GetRadar()
    {
        var userId = GetUserId();
        var role = GetRole();

        return role switch
        {
            "Vendor"    => Ok(await GetVendorRadar(userId)),
            "Validator" => Ok(await GetVerifikatorRadar(userId)),
            "Admin" or "SysAdmin" => Ok(await GetManagerRadar()),
            "FrontDesk" => Ok(await GetFrontDeskRadar()),
            _           => Ok(await GetVendorRadar(userId))
        };
    }

    // ── VENDOR RADAR ──────────────────────────────────────────────────────
    private async Task<object> GetVendorRadar(Guid vendorId)
    {
        var docs = await _db.Documents
            .Where(d => d.CreatedByUserId == vendorId && !d.IsDeleted)
            .ToListAsync();

        return new
        {
            myDocuments = new
            {
                draft             = docs.Count(d => d.Status == DocumentStatus.Draft),
                submitted         = docs.Count(d => d.Status == DocumentStatus.Submitted),
                inTransit         = docs.Count(d => d.Status == DocumentStatus.PreArrivalDeclared),
                atFrontDesk       = docs.Count(d => d.Status == DocumentStatus.ReceivedAtFrontDesk),
                pendingConfirmation = docs.Count(d => d.Status == DocumentStatus.PendingDualConfirmation),
                inReview          = docs.Count(d => d.Status == DocumentStatus.InReview ||
                                                    d.Status == DocumentStatus.ReceivedByVerifikator),
                returnedToMe      = docs.Count(d => d.Status == DocumentStatus.ReturnedToVendor ||
                                                    d.Status == DocumentStatus.WaitingPickupConfirmation),
                approved          = docs.Count(d => d.Status == DocumentStatus.Approved),
                rejected          = docs.Count(d => d.Status == DocumentStatus.Rejected),
                total             = docs.Count
            },
            needsAction = docs
                .Where(d => d.Status == DocumentStatus.PendingDualConfirmation ||
                            d.Status == DocumentStatus.ReturnedToVendor ||
                            d.Status == DocumentStatus.WaitingPickupConfirmation)
                .Select(d => new
                {
                    d.Id,
                    d.DocumentNumber,
                    d.Title,
                    statusLabel = GetStatusLabel(d.Status),
                    action = d.Status == DocumentStatus.PendingDualConfirmation
                        ? "Konfirmasi serah terima"
                        : "Ambil dokumen"
                })
                .ToList()
        };
    }

    // ── VERIFIKATOR RADAR ─────────────────────────────────────────────────
    private async Task<object> GetVerifikatorRadar(Guid verifikatorId)
    {
        var now = DateTime.UtcNow;

        // Dokumen yang menuju ke saya (pre-arrival)
        var incoming = await _db.Documents
            .Where(d => d.Status == DocumentStatus.PreArrivalDeclared
                     && !d.IsDeleted)
            .CountAsync();

        // Di front desk (perlu dijemput)
        var atFrontDesk = await _db.Documents
            .Where(d => d.Status == DocumentStatus.ReceivedAtFrontDesk
                     && !d.IsDeleted)
            .CountAsync();

        // Dititip untuk saya (perlu konfirmasi)
        var droppedForMe = await _db.Documents
            .Where(d => d.Status == DocumentStatus.DroppedOffPendingAck
                     && d.AssignedToUserId == verifikatorId
                     && !d.IsDeleted)
            .CountAsync();

        // Sedang saya review
        var myReview = await _db.Documents
            .Where(d => (d.Status == DocumentStatus.InReview ||
                         d.Status == DocumentStatus.ReceivedByVerifikator)
                     && d.CurrentHolderId == verifikatorId
                     && !d.IsDeleted)
            .CountAsync();

        // SLA warning
        var slaWarning = await _db.Documents
            .Where(d => d.SlaDeadlineAt != null
                     && d.SlaDeadlineAt > now
                     && d.SlaDeadlineAt < now.AddHours(2)
                     && d.CurrentHolderId == verifikatorId
                     && !d.SlaBreached
                     && !d.IsDeleted)
            .CountAsync();

        // SLA breach
        var slaBreach = await _db.Documents
            .Where(d => d.SlaBreached
                     && d.CurrentHolderId == verifikatorId
                     && !d.IsDeleted)
            .CountAsync();

        // Detail dokumen yang perlu aksi
        var needsAction = await _db.Documents
            .Where(d => (d.Status == DocumentStatus.DroppedOffPendingAck
                            && d.AssignedToUserId == verifikatorId) ||
                        (d.Status == DocumentStatus.ReceivedByVerifikator
                            && d.CurrentHolderId == verifikatorId) ||
                        (d.SlaBreached && d.CurrentHolderId == verifikatorId)
                     && !d.IsDeleted)
            .Select(d => new
            {
                d.Id,
                d.DocumentNumber,
                d.Title,
                statusLabel = GetStatusLabel(d.Status),
                d.SlaBreached,
                d.SlaDeadlineAt,
                d.DropOffAt,
                urgency = d.SlaBreached ? "critical" :
                         d.SlaDeadlineAt < now.AddHours(2) ? "warning" : "normal"
            })
            .ToListAsync();

        return new
        {
            summary = new
            {
                incomingDocuments  = incoming,
                atFrontDesk        = atFrontDesk,
                droppedForMe       = droppedForMe,
                myActiveReview     = myReview,
                slaWarning         = slaWarning,
                slaBreach          = slaBreach
            },
            needsAction
        };
    }

    // ── MANAGER / ADMIN RADAR ─────────────────────────────────────────────
    private async Task<object> GetManagerRadar()
    {
        var now = DateTime.UtcNow;

        var allActive = await _db.Documents
            .Include(d => d.CurrentHolder)
            .Include(d => d.AssignedToUser)
            .Where(d => d.Status != DocumentStatus.Approved
                     && d.Status != DocumentStatus.Rejected
                     && d.Status != DocumentStatus.Archived
                     && d.Status != DocumentStatus.Draft
                     && !d.IsDeleted)
            .ToListAsync();

        var teamPerformance = await _db.Documents
            .Include(d => d.CurrentHolder)
            .Where(d => d.CurrentHolderId != null
                     && d.Status == DocumentStatus.InReview
                     && !d.IsDeleted)
            .GroupBy(d => new { d.CurrentHolderId, d.CurrentHolder!.FullName })
            .Select(g => new
            {
                userId   = g.Key.CurrentHolderId,
                name     = g.Key.FullName,
                inReview = g.Count(),
                breached = g.Count(d => d.SlaBreached)
            })
            .ToListAsync();

        return new
        {
            overview = new
            {
                totalActive         = allActive.Count,
                preArrival          = allActive.Count(d => d.Status == DocumentStatus.PreArrivalDeclared),
                atFrontDesk         = allActive.Count(d => d.Status == DocumentStatus.ReceivedAtFrontDesk),
                pendingConfirmation = allActive.Count(d => d.Status == DocumentStatus.PendingDualConfirmation),
                inReview            = allActive.Count(d => d.Status == DocumentStatus.InReview),
                droppedPendingAck   = allActive.Count(d => d.Status == DocumentStatus.DroppedOffPendingAck),
                waitingPickup       = allActive.Count(d => d.Status == DocumentStatus.WaitingPickupConfirmation),
                slaBreached         = allActive.Count(d => d.SlaBreached),
                escalationSent      = allActive.Count(d => d.EscalationSent)
            },
            escalations = allActive
                .Where(d => d.EscalationSent || d.SlaBreached)
                .Select(d => new
                {
                    d.Id,
                    d.DocumentNumber,
                    d.Title,
                    statusLabel     = GetStatusLabel(d.Status),
                    holderName      = d.CurrentHolder?.FullName ?? d.AssignedToUser?.FullName,
                    d.SlaBreached,
                    d.EscalationSent,
                    d.PreArrivalDeclaredAt,
                    d.DropOffAt
                })
                .ToList(),
            teamPerformance
        };
    }

    // ── FRONT DESK RADAR ──────────────────────────────────────────────────
    private async Task<object> GetFrontDeskRadar()
    {
        var incoming = await _db.Documents
            .Where(d => d.Status == DocumentStatus.PreArrivalDeclared && !d.IsDeleted)
            .Select(d => new
            {
                d.Id,
                d.DocumentNumber,
                d.Title,
                d.VendorName,
                d.PreArrivalDeclaredAt,
                minutesAgo = (int)(DateTime.UtcNow - d.PreArrivalDeclaredAt!.Value).TotalMinutes
            })
            .ToListAsync();

        var atDesk = await _db.Documents
            .Where(d => d.Status == DocumentStatus.ReceivedAtFrontDesk && !d.IsDeleted)
            .Select(d => new
            {
                d.Id,
                d.DocumentNumber,
                d.Title,
                d.TargetDepartment,
                d.FrontDeskReceivedAt,
                minutesWaiting = (int)(DateTime.UtcNow - d.FrontDeskReceivedAt!.Value).TotalMinutes
            })
            .ToListAsync();

        return new
        {
            summary = new
            {
                incomingCount = incoming.Count,
                waitingAtDesk = atDesk.Count
            },
            incoming,
            waitingAtDesk = atDesk
        };
    }

    private static string GetStatusLabel(DocumentStatus s) => s switch
    {
        DocumentStatus.Draft                     => "Draft",
        DocumentStatus.Submitted                 => "Diajukan",
        DocumentStatus.PreArrivalDeclared        => "Sedang Diantar",
        DocumentStatus.ReceivedAtFrontDesk       => "Di Front Desk",
        DocumentStatus.PendingDualConfirmation   => "Menunggu Konfirmasi",
        DocumentStatus.ReceivedByVerifikator     => "Diterima Verifikator",
        DocumentStatus.DroppedOffPendingAck      => "Dititip - Menunggu Konfirmasi",
        DocumentStatus.InReview                  => "Sedang Direview",
        DocumentStatus.ReturnInitiated           => "Return Dimulai",
        DocumentStatus.WaitingPickupConfirmation => "Menunggu Pickup OTP",
        DocumentStatus.ReturnedToVendor          => "Dikembalikan ke Vendor",
        DocumentStatus.Approved                  => "Disetujui",
        DocumentStatus.Rejected                  => "Ditolak",
        _                                        => s.ToString()
    };
}
