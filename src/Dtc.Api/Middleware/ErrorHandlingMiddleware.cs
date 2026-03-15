namespace Dtc.Api.Middleware;

using System.Net;
using System.Text.Json;
using System.Diagnostics;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ErrorHandlingMiddleware(RequestDelegate next,
        ILogger<ErrorHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ArgumentException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, ex.Message, ex);
        }
        catch (InvalidOperationException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, ex.Message, ex);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.Forbidden, ex.Message, ex);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.NotFound, ex.Message, ex);
        }
        catch (OperationCanceledException)
        {
            // Client disconnected — tidak perlu log sebagai error
            context.Response.StatusCode = 499;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}: {Message}",
                context.Request.Method, context.Request.Path, ex.Message);
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError,
                "An unexpected error occurred. Please try again later.", ex);
        }
    }

    private async Task WriteErrorAsync(HttpContext context, HttpStatusCode statusCode,
        string message, Exception? ex = null)
    {
        if (context.Response.HasStarted) return;

        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new Dictionary<string, object?>
        {
            ["success"] = false,
            ["error"] = message,
            ["statusCode"] = (int)statusCode,
            ["traceId"] = traceId,
            ["timestamp"] = DateTime.UtcNow
        };

        // Tampilkan stack trace hanya di Development
        if (_env.IsDevelopment() && ex is not null)
        {
            response["detail"] = ex.ToString();
        }

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            })
        );
    }
}
