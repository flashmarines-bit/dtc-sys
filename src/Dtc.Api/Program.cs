using Hangfire;
using Hangfire.PostgreSql;
using System.Text;
using Dtc.Infrastructure;
using Dtc.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
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

var app = builder.Build();

// Seed database
await DbSeeder.SeedAsync(app.Services);

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health check
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "DTC API",
    timestamp = DateTime.UtcNow
}));

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Hangfire Dashboard (dev only)
if (app.Environment.IsDevelopment())
    app.UseHangfireDashboard("/hangfire");

// Recurring cleanup job — setiap hari jam 02:00
RecurringJob.AddOrUpdate<Dtc.Infrastructure.Jobs.AnalysisJob>(
    "cleanup-expired-submissions",
    job => job.CleanupExpiredAsync(),
    "0 2 * * *");

app.Run();
