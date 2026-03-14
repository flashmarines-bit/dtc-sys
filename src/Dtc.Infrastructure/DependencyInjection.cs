using Dtc.Application.Interfaces;
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
        services.AddScoped<IStorageService, SupabaseStorageService>();
        services.AddScoped<IDocumentService, DocumentService>();

        return services;
    }
}
