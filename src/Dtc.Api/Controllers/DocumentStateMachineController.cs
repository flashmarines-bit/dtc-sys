namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.Interfaces;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentStateMachineController : ControllerBase
{
    private readonly IDocumentStateMachineService _sm;

    public DocumentStateMachineController(IDocumentStateMachineService sm)
        => _sm = sm;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value!);

    private string GetRole() =>
        User.FindFirst(ClaimTypes.Role)?.Value
        ?? User.FindFirst("role")?.Value ?? "";

    /// <summary>QR Scan — return available actions berdasarkan role + status</summary>
    [HttpGet("{id:guid}/scan")]
    public async Task<IActionResult> Scan(Guid id)
    {
        var result = await _sm.HandleQrScanAsync(id, GetUserId(), GetRole());
        if (!result.Success)
            return NotFound(new { error = result.Message });
        return Ok(result);
    }

    /// <summary>Vendor: submit dokumen</summary>
    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var r = await _sm.SubmitAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Vendor: deklarasi sedang mengantar</summary>
    [HttpPost("{id:guid}/pre-arrival")]
    public async Task<IActionResult> PreArrival(Guid id)
    {
        var r = await _sm.DeclarePreArrivalAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Vendor: konfirmasi serah terima (dual confirmation)</summary>
    [HttpPost("{id:guid}/confirm-handover")]
    public async Task<IActionResult> ConfirmHandover(Guid id)
    {
        var r = await _sm.VendorConfirmHandoverAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Front desk: terima fisik di lobi</summary>
    [HttpPost("{id:guid}/frontdesk-receive")]
    public async Task<IActionResult> FrontDeskReceive(Guid id)
    {
        var r = await _sm.FrontDeskReceiveAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Verifikator: terima fisik (trigger dual confirmation)</summary>
    [HttpPost("{id:guid}/verifikator-receive")]
    public async Task<IActionResult> VerifikatorReceive(Guid id)
    {
        var r = await _sm.VerifikatorReceiveAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Drop-off: titip di meja + foto wajib</summary>
    [HttpPost("{id:guid}/dropoff")]
    public async Task<IActionResult> DropOff(Guid id,
        [FromForm] Guid targetUserId,
        [FromForm] IFormFile photo)
    {
        if (photo is null || photo.Length == 0)
            return BadRequest(new { error = "Foto bukti drop-off wajib diupload." });

        var storagePath = $"dropoff-photos/{id}/{DateTime.UtcNow:yyyyMMddHHmmss}_{photo.FileName}";
        // TODO: upload via IStorageService — untuk sekarang simpan path saja
        using var stream = photo.OpenReadStream();

        var r = await _sm.DropOffAsync(id, GetUserId(), targetUserId, storagePath);
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Acknowledge drop-off — target konfirmasi terima titipan</summary>
    [HttpPost("{id:guid}/acknowledge-dropoff")]
    public async Task<IActionResult> AcknowledgeDropOff(Guid id)
    {
        var r = await _sm.AcknowledgeDropOffAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Take over dari verifikator lain</summary>
    [HttpPost("{id:guid}/takeover")]
    public async Task<IActionResult> TakeOver(Guid id)
    {
        var r = await _sm.TakeOverAsync(id, GetUserId());
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Inisiasi return ke vendor + generate OTP</summary>
    [HttpPost("{id:guid}/initiate-return")]
    public async Task<IActionResult> InitiateReturn(Guid id,
        [FromBody] InitiateReturnRequest request)
    {
        var r = await _sm.InitiateReturnAsync(id, GetUserId(), request.Reason);
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Verifikasi OTP kurir untuk pickup</summary>
    [HttpPost("{id:guid}/verify-otp")]
    public async Task<IActionResult> VerifyOtp(Guid id,
        [FromBody] VerifyOtpRequest request)
    {
        var r = await _sm.VerifyPickupOtpAsync(id, GetUserId(), request.OtpCode);
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Approve dokumen</summary>
    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id,
        [FromBody] ApproveRequest? request)
    {
        var r = await _sm.ApproveAsync(id, GetUserId(), request?.Notes);
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }

    /// <summary>Reject dokumen</summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id,
        [FromBody] RejectRequest request)
    {
        var r = await _sm.RejectAsync(id, GetUserId(), request.Reason);
        return r.Success ? Ok(r) : BadRequest(new { error = r.Error });
    }
}

public record InitiateReturnRequest(string Reason);
public record VerifyOtpRequest(string OtpCode);
public record ApproveRequest(string? Notes);
public record RejectRequest(string Reason);
