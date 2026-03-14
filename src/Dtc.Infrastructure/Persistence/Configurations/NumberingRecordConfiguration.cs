using Dtc.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dtc.Infrastructure.Persistence.Configurations;

public class NumberingRecordConfiguration : IEntityTypeConfiguration<NumberingRecord>
{
    public void Configure(EntityTypeBuilder<NumberingRecord> builder)
    {
        builder.HasKey(n => n.Id);

        // Unique per DocumentType + Year + Department
        builder.HasIndex(n => new { n.DocumentTypeId, n.Year, n.Department })
            .IsUnique();

        builder.HasOne(n => n.DocumentType)
            .WithMany()
            .HasForeignKey(n => n.DocumentTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
