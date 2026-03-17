using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiRoleSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Tambah kolom Roles baru
            migrationBuilder.AddColumn<string>(
                name: "Roles",
                table: "Users",
                type: "jsonb",
                nullable: false,
                defaultValue: "[\"User\"]");

            // Step 2: Migrate data lama — konversi string "SysAdmin" → ["SysAdmin"]
            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""Roles"" = ('[""' || ""Role"" || '""]')::jsonb
                WHERE ""Role"" IS NOT NULL AND ""Role"" != '';
            ");

            // Step 3: Hapus kolom Role lama
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore kolom Role lama
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "User");

            // Migrate balik — ambil role pertama dari array
            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""Role"" = ""Roles""::json->>0
                WHERE ""Roles"" IS NOT NULL;
            ");

            migrationBuilder.DropColumn(
                name: "Roles",
                table: "Users");
        }
    }
}
