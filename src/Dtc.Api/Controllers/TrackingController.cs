namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;

[ApiController]
[Route("api/tracking")]
[Authorize]
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _tracking;

    public TrackingController(ITrackingService tracking)
    {
        _tracking = tracking;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    /// <summary>Scan QR Code — returns document info + available actions</summary>
    [HttpGet("scan/{qrCode}")]
    public async Task<IActionResult> Scan(string qrCode)
    {
        var result = await _tracking.ScanQrAsync(qrCode, GetUserId());
        if (result is null) return NotFound(new { error = "QR Code not found." });
        return Ok(result);
    }

    /// <summary>Get document tracking history</summary>
    [HttpGet("{documentId:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid documentId)
    {
        var result = await _tracking.GetHistoryAsync(documentId);
        return Ok(result);
    }

    /// <summary>Submit document (Draft → Submitted)</summary>
    [HttpPost("{documentId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid documentId, [FromBody] string? notes = null)
    {
        try { return Ok(await _tracking.SubmitAsync(documentId, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Receive document — Front Desk (Submitted → Received)</summary>
    [HttpPost("{documentId:guid}/receive")]
    public async Task<IActionResult> Receive(Guid documentId, [FromBody] ReceiveDocumentRequest request)
    {
        try { return Ok(await _tracking.ReceiveAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Assign document to verifier (Received → Assigned)</summary>
    [HttpPost("{documentId:guid}/assign")]
    public async Task<IActionResult> Assign(Guid documentId, [FromBody] AssignDocumentRequest request)
    {
        try { return Ok(await _tracking.AssignAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Start review (Assigned → UnderReview)</summary>
    [HttpPost("{documentId:guid}/start-review")]
    public async Task<IActionResult> StartReview(Guid documentId, [FromBody] string? notes = null)
    {
        try { return Ok(await _tracking.StartReviewAsync(documentId, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Approve document (UnderReview → Approved)</summary>
    [HttpPost("{documentId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid documentId, [FromBody] string? notes = null)
    {
        try { return Ok(await _tracking.ApproveAsync(documentId, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Return document (UnderReview/Assigned → Returned)</summary>
    [HttpPost("{documentId:guid}/return")]
    public async Task<IActionResult> Return(Guid documentId, [FromBody] ReturnDocumentRequest request)
    {
        try { return Ok(await _tracking.ReturnAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Initiate handover — generates OTP</summary>
    [HttpPost("{documentId:guid}/handover/initiate")]
    public async Task<IActionResult> InitiateHandover(Guid documentId, [FromBody] InitiateHandoverRequest request)
    {
        try { return Ok(await _tracking.InitiateHandoverAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Confirm handover — validate OTP</summary>
    [HttpPost("{documentId:guid}/handover/confirm")]
    public async Task<IActionResult> ConfirmHandover(Guid documentId, [FromBody] ConfirmHandoverRequest request)
    {
        try { return Ok(await _tracking.ConfirmHandoverAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Upload photo proof (recipient absent)</summary>
    [HttpPost("{documentId:guid}/handover/photo-proof")]
    public async Task<IActionResult> UploadPhotoProof(Guid documentId, IFormFile photo)
    {
        if (photo is null || photo.Length == 0)
            return BadRequest(new { error = "No photo provided." });
        try
        {
            using var stream = photo.OpenReadStream();
            return Ok(await _tracking.UploadPhotoProofAsync(documentId, GetUserId(), stream, photo.FileName, photo.ContentType));
        }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Dashboard metrics</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        return Ok(await _tracking.GetDashboardAsync());
    }

    /// <summary>List SLA overdue documents</summary>
    [HttpGet("sla-overdue")]
    public async Task<IActionResult> SlaOverdue()
    {
        return Ok(await _tracking.GetSlaOverdueAsync());
    }
}
