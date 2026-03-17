namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/validator")]
[Authorize]
public class ValidatorController : ControllerBase
{
    private readonly IValidatorService _validator;
    public ValidatorController(IValidatorService validator) => _validator = validator;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
        => Ok(await _validator.GetQueueAsync());

    [HttpGet("review/{id:guid}")]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await _validator.GetDetailAsync(id);
        if (result is null) return NotFound(new { error = "Submission not found." });
        return Ok(result);
    }

    [HttpPost("review/{id:guid}/approve")]
    [Authorize(Roles = "Validator,Admin,SysAdmin")]
    public async Task<IActionResult> Approve(Guid id, [FromQuery] string? notes = null)
    {
        try { return Ok(await _validator.ApproveAsync(id, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("review/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectSubmissionRequest request)
    {
        try { return Ok(await _validator.RejectAsync(id, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("review/{id:guid}/return-for-revision")]
    public async Task<IActionResult> ReturnForRevision(Guid id, [FromBody] ReturnForRevisionRequest request)
    {
        try { return Ok(await _validator.ReturnForRevisionAsync(id, GetUserId(), request.ReturnNotes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

}