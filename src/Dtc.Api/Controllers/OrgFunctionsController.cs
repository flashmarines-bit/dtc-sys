namespace Dtc.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/org-functions")]
[Authorize]
public class OrgFunctionsController : ControllerBase
{
    private readonly IOrgFunctionService _service;

    public OrgFunctionsController(IOrgFunctionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search = null)
    {
        var result = await _service.GetAllAsync(search);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result is null) return NotFound(new { error = "Function not found." });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateOrgFunctionRequest request)
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

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOrgFunctionRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
            if (result is null) return NotFound(new { error = "Function not found." });
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.SysAdmin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound(new { error = "Function not found." });
        return Ok(new { message = "Function deleted." });
    }
}
