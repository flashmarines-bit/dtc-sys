using Dtc.Application.Interfaces;
using Dtc.Infrastructure.Jobs;
using Dtc.Infrastructure.Notifications;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Extensions.Http;
using System.Net;
using Dtc.Infrastructure.Persistence;
using Dtc.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Dtc.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<DtcDbContext>(options =>
            options.UseNpgsql(connectionString));

        // HttpClient for Supabase Storage
        services.AddHttpClient("SupabaseStorage");

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IDocumentTypeService, DocumentTypeService>();
        services.AddScoped<IOrgFunctionService, OrgFunctionService>();
        // Storage factory — swap provider via config
        // Storage:Provider = supabase (default) | minio | local
        services.AddScoped<IStorageService>(provider =>
        {
            var config = provider.GetRequiredService<IConfiguration>();
            var storageProvider = config["Storage:Provider"]?.ToLower() ?? "supabase";
            return storageProvider switch
            {
                "minio" => provider.GetRequiredService<MinioStorageService>(),
                "local" => provider.GetRequiredService<LocalDiskStorageService>(),
                _       => provider.GetRequiredService<SupabaseStorageService>()
            };
        });
        services.AddScoped<SupabaseStorageService>();
        services.AddScoped<MinioStorageService>();
        services.AddScoped<LocalDiskStorageService>();
        services.AddHttpClient("MinioStorage");
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<ITrackingService, TrackingService>();
        services.AddScoped<IQrCodeService, QrCodeService>();
        services.AddScoped<ILibraryService, LibraryService>();
        services.AddScoped<IVendorService, VendorService>();
        services.AddScoped<IValidatorService, ValidatorService>();
        services.AddScoped<IOcrService, OcrService>();
        services.AddScoped<IEmailService, EmailService>();

        // Notification channels — plug & play
        services.AddScoped<INotificationChannel, EmailNotificationChannel>();
        services.AddScoped<INotificationChannel, InAppNotificationChannel>();
        services.AddScoped<INotificationChannel, WhatsAppNotificationChannel>();

        // Notification service dispatcher
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ISystemSettingService, SystemSettingService>();
        services.AddScoped<IDynamicFormService, DynamicFormService>();
        services.AddScoped<IDocumentStateMachineService, DocumentStateMachineService>();
        services.AddScoped<Module1AlarmJob>();
        services.AddScoped<LibraryExpiryJob>();
        // OCR Service HttpClient dengan Polly retry + circuit breaker
        services.AddHttpClient("OcrService", client =>
        {
            client.Timeout = TimeSpan.FromMinutes(21); // Sedikit lebih dari job timeout
        })
        .AddPolicyHandler((services, request) =>
            HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(r => r.StatusCode == HttpStatusCode.TooManyRequests)
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                    onRetry: (outcome, timespan, attempt, ctx) =>
                    {
                        var logger = services.GetService<ILogger<OcrService>>();
                        logger?.LogWarning(
                            "OCR retry attempt {Attempt} after {Delay}s. Reason: {Reason}",
                            attempt, timespan.TotalSeconds,
                            outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
                    }))
        .AddPolicyHandler((services, request) =>
            HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: 5,
                    durationOfBreak: TimeSpan.FromSeconds(30),
                    onBreak: (outcome, breakDelay) =>
                    {
                        var logger = services.GetService<ILogger<OcrService>>();
                        logger?.LogError(
                            "OCR Circuit OPEN for {Seconds}s. Last error: {Error}",
                            breakDelay.TotalSeconds,
                            outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
                    },
                    onReset: () =>
                    {
                        var logger = services.GetService<ILogger<OcrService>>();
                        logger?.LogInformation("OCR Circuit CLOSED — service recovered");
                    },
                    onHalfOpen: () =>
                    {
                        var logger = services.GetService<ILogger<OcrService>>();
                        logger?.LogWarning("OCR Circuit HALF-OPEN — testing recovery");
                    }));

        return services;
    }
}
