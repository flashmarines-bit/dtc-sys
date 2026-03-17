using Dtc.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace Dtc.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(256);

        // FIX: Roles disimpan sebagai JSON array, kolom Role lama dihapus
        builder.Property(u => u.Roles)
            .HasColumnName("Roles")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string> { "User" }
            )
            .IsRequired();

        // Ignore computed properties
        builder.Ignore(u => u.PrimaryRole);
    }
}
