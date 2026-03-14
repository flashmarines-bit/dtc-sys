namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/library")]
[Authorize]
public class LibraryController : ControllerBase
{
    private readonly ILibraryService _library;
    public LibraryController(ILibraryService library) => _library = library;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] Guid? documentTypeId = null,
        [FromQuery] string? category = null, [FromQuery] string? tag = null,
        [FromQuery] bool approvedOnly = false)
    {
        var result = await _library.GetAllAsync(page, pageSize, search, documentTypeId, category, tag, approvedOnly);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _library.GetByIdAsync(id);
        if (result is null) return NotFound(new { error = "Document not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLibraryDocumentRequest request)
    {
        try { return Ok(await _library.CreateAsync(request, GetUserId())); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("propose")]
    public async Task<IActionResult> Propose([FromBody] ProposeToLibraryRequest request)
    {
        try { return Ok(await _library.ProposeAsync(request, GetUserId())); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/start-review")]
    public async Task<IActionResult> StartReview(Guid id, [FromQuery] string? notes = null)
    {
        try { return Ok(await _library.StartReviewAsync(id, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/review")]
    public async Task<IActionResult> Review(Guid id, [FromBody] ReviewLibraryDocumentRequest request)
    {
        try { return Ok(await _library.ReviewAsync(id, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, [FromQuery] string? notes = null)
    {
        try { return Ok(await _library.ArchiveAsync(id, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("{id:guid}/upload")]
    public async Task<IActionResult> Upload(Guid id, IFormFile file, [FromQuery] string? notes = null)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file provided." });
        try
        {
            using var stream = file.OpenReadStream();
            return Ok(await _library.UploadFileAsync(id, stream, file.FileName, file.ContentType, notes, GetUserId()));
        }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await _library.DownloadFileAsync(id);
        if (result is null) return NotFound(new { error = "File not found." });
        var (stream, fileName, contentType) = result.Value;
        return File(stream, contentType, fileName);
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid id)
        => Ok(await _library.GetVersionsAsync(id));

    [HttpPatch("{id:guid}/tags")]
    public async Task<IActionResult> UpdateTags(Guid id, [FromBody] UpdateLibraryTagsRequest request)
    {
        var result = await _library.UpdateTagsAsync(id, request, GetUserId());
        if (result is null) return NotFound(new { error = "Document not found." });
        return Ok(result);
    }
}
