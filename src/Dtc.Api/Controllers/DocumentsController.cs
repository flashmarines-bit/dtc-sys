namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _service;

    public DocumentsController(IDocumentService service)
    {
        _service = service;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    /// <summary>
    /// List documents with optional filters
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? documentTypeId = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, search, documentTypeId);
        return Ok(result);
    }

    /// <summary>
    /// Get document by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result is null) return NotFound(new { error = "Document not found." });
        return Ok(result);
    }

    /// <summary>
    /// Create new document (auto-numbering)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update document metadata
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        if (result is null) return NotFound(new { error = "Document not found." });
        return Ok(result);
    }

    /// <summary>
    /// Soft-delete document (SysAdmin, Admin)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound(new { error = "Document not found." });
        return Ok(new { message = "Document deleted." });
    }

    /// <summary>
    /// Upload file to document
    /// </summary>
    [HttpPost("{id:guid}/upload")]
    public async Task<IActionResult> Upload(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _service.UploadFileAsync(id, stream, file.FileName, file.ContentType, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(502, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Download document file
    /// </summary>
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await _service.DownloadFileAsync(id);
        if (result is null) return NotFound(new { error = "File not found." });

        var (stream, fileName, contentType) = result.Value;
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// List document versions
    /// </summary>
    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid id)
    {
        var versions = await _service.GetVersionsAsync(id);
        return Ok(versions);
    }

    /// <summary>
    /// Upload new version
    /// </summary>
    [HttpPost("{id:guid}/versions")]
    public async Task<IActionResult> UploadVersion(Guid id, IFormFile file, [FromQuery] string? notes = null)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _service.UploadNewVersionAsync(id, stream, file.FileName, file.ContentType, notes, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
