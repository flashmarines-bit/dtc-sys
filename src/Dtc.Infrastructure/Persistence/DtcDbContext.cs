using Dtc.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dtc.Infrastructure.Persistence;

public class DtcDbContext : DbContext
{
    public DtcDbContext(DbContextOptions<DtcDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<OrganizationFunction> OrganizationFunctions => Set<OrganizationFunction>();
    public DbSet<WorkflowTemplate> WorkflowTemplates => Set<WorkflowTemplate>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<WorkflowInstance> WorkflowInstances => Set<WorkflowInstance>();
    public DbSet<WorkflowAction> WorkflowActions => Set<WorkflowAction>();
    public DbSet<DocumentTracking> DocumentTrackings => Set<DocumentTracking>();
    public DbSet<NumberingRecord> NumberingRecords => Set<NumberingRecord>();
    public DbSet<SlaConfiguration> SlaConfigurations => Set<SlaConfiguration>();
    public DbSet<SignatoryConfig> SignatoryConfigs => Set<SignatoryConfig>();
    public DbSet<PendingVendorRequest> PendingVendorRequests => Set<PendingVendorRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DtcDbContext).Assembly);

        // Global query filters - soft delete
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Document>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<DocumentType>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<OrganizationFunction>().HasQueryFilter(e => !e.IsDeleted);

        // DocumentTracking — no cascade delete conflicts
        modelBuilder.Entity<DocumentTracking>(b =>
        {
            b.HasOne(t => t.Document)
             .WithMany(d => d.TrackingLogs)
             .HasForeignKey(t => t.DocumentId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(t => t.ActedByUser)
             .WithMany()
             .HasForeignKey(t => t.ActedByUserId)
             .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(t => t.RecipientUser)
             .WithMany()
             .HasForeignKey(t => t.RecipientUserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Document — AssignedToUser + LibraryReviewedByUser no cascade
        modelBuilder.Entity<Document>(b =>
        {
            b.HasOne(d => d.AssignedToUser)
             .WithMany()
             .HasForeignKey(d => d.AssignedToUserId)
             .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(d => d.LibraryReviewedByUser)
             .WithMany()
             .HasForeignKey(d => d.LibraryReviewedByUserId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Domain.Common.BaseEntity entity)
            {
                if (entry.State == EntityState.Modified)
                    entity.UpdatedAt = DateTime.UtcNow;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
