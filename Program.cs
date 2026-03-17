using Serilog;
using Serilog.Events;
using Dtc.Infrastructure.Jobs;
using Dtc.Api.Middleware;
using Hangfire;
using Hangfire.PostgreSql;
using System.Text;
using Dtc.Infrastructure;
using Dtc.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, services, config) => config
    .ReadFrom.Configuration(ctx.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "DTC-API"));

// Add services
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = ctx =>
        {
            var errors = ctx.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(e => e.Value!.Errors.Select(x =>
                    string.IsNullOrEmpty(x.ErrorMessage) ? x.Exception?.Message : x.ErrorMessage))
                .Where(e => e is not null)
                .ToList();

            var result = new Microsoft.AspNetCore.Mvc.ObjectResult(new
            {
                success = false,
                error = errors.FirstOrDefault() ?? "Validation failed.",
                errors = errors,
                statusCode = 400,
                timestamp = DateTime.UtcNow
            }) { StatusCode = 400 };
            return result;
        };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Infrastructure (DbContext + AuthService)
builder.Services.AddInfrastructure(builder.Configuration);

// Hangfire
var hangfireConn = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(hangfireConn)));
builder.Services.AddHangfireServer(options => options.WorkerCount = 2);
builder.Services.AddScoped<HangfireJobFilter>();

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddAuthorization();

// FIX: CORS origins dibaca dari config (appsettings/env), bukan hardcode
builder.Services.AddCors(options =>
{
    options.AddPolicy("DtcFrontend", policy =>
    {
        // Baca dari config: Cors:AllowedOrigins (array)
        // Contoh di appsettings.Development.json:
        // "Cors": { "AllowedOrigins": ["http://localhost:3000", "https://YOUR-CODESPACE-URL-3000.app.github.dev"] }
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:3000"];

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddDtcRateLimiting();

var app = builder.Build();

// Hangfire dead letter filter
using (var scope = app.Services.CreateScope())
{
    var filter = scope.ServiceProvider.GetRequiredService<HangfireJobFilter>();
    Hangfire.GlobalJobFilters.Filters.Add(filter);
}

// Register Module 1 Alarm recurring jobs via IRecurringJobManager
using (var scope = app.Services.CreateScope())
{
    var jobManager = scope.ServiceProvider
        .GetRequiredService<IRecurringJobManager>();

    jobManager.AddOrUpdate<Module1AlarmJob>(
        "alarm-pre-arrival-timeout",
        j => j.CheckPreArrivalTimeoutAsync(),
        "*/30 * * * *");

    jobManager.AddOrUpdate<Module1AlarmJob>(
        "alarm-dropoff-unacknowledged",
        j => j.CheckDropOffUnacknowledgedAsync(),
        "*/15 * * * *");

    jobManager.AddOrUpdate<Module1AlarmJob>(
        "alarm-sla-breach",
        j => j.CheckSlaBreachAsync(),
        "*/10 * * * *");

    jobManager.AddOrUpdate<Module1AlarmJob>(
        "alarm-otp-expired",
        j => j.CheckOtpExpiredAsync(),
        "0 * * * *");

    jobManager.AddOrUpdate<Module1AlarmJob>(
        "alarm-floating-documents",
        j => j.CheckFloatingDocumentsAsync(),
        "0 8 * * *");

    jobManager.AddOrUpdate<LibraryExpiryJob>(
        "library-expiry-check",
        j => j.CheckExpiringDocumentsAsync(),
        "0 9 * * *");
}

// Seed database
await DbSeeder.SeedAsync(app.Services);

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health check
app.MapGet("/health", async (DtcDbContext db, IConfiguration config) =>
{
    var checks = new Dictionary<string, object>();
    var allHealthy = true;

    try
    {
        await db.Database.CanConnectAsync();
        checks["database"] = "healthy";
    }
    catch (Exception ex)
    {
        checks["database"] = $"unhealthy: {ex.Message}";
        allHealthy = false;
    }

    try
    {
        var ocrUrl = config["OcrService:BaseUrl"] ?? "http://localhost:8000";
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
        var resp = await http.GetAsync($"{ocrUrl}/health");
        checks["ocr"] = resp.IsSuccessStatusCode ? "healthy" : "degraded";
    }
    catch
    {
        checks["ocr"] = "unavailable";
    }

    return Results.Ok(new
    {
        status = allHealthy ? "Healthy" : "Degraded",
        service = "DTC API",
        version = "1.0.0",
        checks,
        timestamp = DateTime.UtcNow
    });
});

app.UseSerilogRequestLogging(opts => {
    opts.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseStatusCodePages(async ctx =>
{
    var res = ctx.HttpContext.Response;
    if (res.ContentType is null || !res.ContentType.Contains("application/json"))
    {
        res.ContentType = "application/json";
        var msg = res.StatusCode switch
        {
            401 => "Authentication required. Please provide a valid token.",
            403 => "You do not have permission to access this resource.",
            404 => "The requested resource was not found.",
            405 => "HTTP method not allowed.",
            _   => "An error occurred."
        };
        await res.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
        {
            success = false,
            error = msg,
            statusCode = res.StatusCode,
            timestamp = DateTime.UtcNow
        }));
    }
});
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("DtcFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
    app.UseHangfireDashboard("/hangfire");

RecurringJob.AddOrUpdate<SlaAlertJob>(
    "sla-alert-all-checks",
    job => job.RunAllChecksAsync(),
    "0 */2 * * *");

RecurringJob.AddOrUpdate<Dtc.Infrastructure.Jobs.AnalysisJob>(
    "cleanup-expired-submissions",
    job => job.CleanupExpiredAsync(),
    "0 2 * * *");

app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "DTC API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
