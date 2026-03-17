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

        // HARUS pertama — fix data lama sebelum EF Core query apapun
        await FixRolesDataFormat(db, logger);
        await SeedSysAdmin(db, logger);
        await PromoteExistingAdmin(db, logger);
    }

    private static async Task FixRolesDataFormat(DtcDbContext db, ILogger logger)
    {
        // Fix data lama format string "SysAdmin" → ["SysAdmin"]
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                UPDATE ""Users""
                SET ""Roles"" = '[""User""]'::jsonb
                WHERE ""Roles""::text = '[""""""{}"""]'
                   OR ""Roles""::text = '[""{}""]'
                   OR ""Roles""::text = '{}'
                   OR ""Roles""::text = 'null';
            ";
            var rows = await cmd.ExecuteNonQueryAsync();
            if (rows > 0)
                logger.LogInformation("✅ Fixed {Rows} users Roles format.", rows);
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    private static async Task SeedSysAdmin(DtcDbContext db, ILogger logger)
    {
        const string adminEmail = "sysadmin@dtc.local";

        var exists = await db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == adminEmail);

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
        logger.LogInformation("✅ SysAdmin user seeded: {Email}", adminEmail);
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
            logger.LogInformation("✅ Promoted admin@dtc.local to SysAdmin");
        }
    }
}
