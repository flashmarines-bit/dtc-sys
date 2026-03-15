namespace Dtc.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Application.DTOs;
using Dtc.Domain.Common;

[ApiController]
[Route("api/document-types")]
[Authorize]
public class DocumentTypesController : ControllerBase
{
    private readonly IDocumentTypeService _service;

    public DocumentTypesController(IDocumentTypeService service)
    {
        _service = service;
    }

    /// <summary>
    /// List all document types (any authenticated user)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, search);
        return Ok(result);
    }

    /// <summary>
    /// Get document type by ID (any authenticated user)
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result is null) return NotFound(new { error = "Document type not found." });
        return Ok(result);
    }

    /// <summary>
    /// Create document type (SysAdmin, Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateDocumentTypeRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update document type (SysAdmin, Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentTypeRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
            if (result is null) return NotFound(new { error = "Document type not found." });
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete document type (SysAdmin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.SysAdmin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound(new { error = "Document type not found." });
        return Ok(new { message = "Document type deleted." });
    }

    /// <summary>GET schema fields untuk DocumentType</summary>
    [HttpGet("{id:guid}/schema")]
    public async Task<IActionResult> GetSchema(Guid id,
        [FromServices] IDynamicFormService dynamicForm)
    {
        var schema = await dynamicForm.GetSchemaAsync(id);
        return Ok(schema);
    }

    /// <summary>GET DocumentType dengan schema lengkap</summary>
    [HttpGet("{id:guid}/with-schema")]
    public async Task<IActionResult> GetWithSchema(Guid id,
        [FromServices] IDynamicFormService dynamicForm)
    {
        var result = await dynamicForm.GetDocumentTypeWithSchemaAsync(id);
        if (result is null) return NotFound(new { error = "DocumentType not found." });
        return Ok(result);
    }

    /// <summary>PUT update MetaSchema</summary>
    [HttpPut("{id:guid}/schema")]
    public async Task<IActionResult> UpdateSchema(Guid id,
        [FromBody] UpdateMetaSchemaRequest request,
        [FromServices] IDynamicFormService dynamicForm)
    {
        try
        {
            var result = await dynamicForm.UpdateSchemaAsync(id, request);
            return Ok(new { message = $"{result.Count} fields saved.", fields = result });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

}