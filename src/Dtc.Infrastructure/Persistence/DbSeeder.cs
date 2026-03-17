namespace Dtc.Infrastructure.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Dtc.Domain.Entities;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DtcDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<DtcDbContext>>();
        await SeedSysAdmin(db, logger);
        await PromoteExistingAdmin(db, logger);
    }

    private static async Task SeedSysAdmin(DtcDbContext db, ILogger logger)
    {
        const string adminEmail = "sysadmin@dtc.local";
        var exists = await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == adminEmail);
        if (exists)
        {
            logger.LogInformation("SysAdmin user already exists, skipping seed.");
            return;
        }
        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "System Administrator",
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SysAdmin@123"),
            Roles = ["SysAdmin"],
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        logger.LogInformation("SysAdmin user seeded: {Email}", adminEmail);
    }

    private static async Task PromoteExistingAdmin(DtcDbContext db, ILogger logger)
    {
        var user = db.Users
            .Where(u => u.Email == "admin@dtc.local")
            .AsEnumerable()
            .FirstOrDefault(u => !u.Roles.Contains("SysAdmin"));
        if (user is not null)
        {
            user.Roles = ["SysAdmin"];
            user.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            logger.LogInformation("Promoted admin@dtc.local to SysAdmin");
        }
    }
}
