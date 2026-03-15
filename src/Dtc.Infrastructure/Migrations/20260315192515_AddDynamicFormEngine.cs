using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicFormEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicableModules",
                table: "DocumentTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "DocumentTypes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MetaSchema",
                table: "DocumentTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DynamicData",
                table: "Documents",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApplicableModules",
                table: "DocumentTypes");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "DocumentTypes");

            migrationBuilder.DropColumn(
                name: "MetaSchema",
                table: "DocumentTypes");

            migrationBuilder.DropColumn(
                name: "DynamicData",
                table: "Documents");
        }
    }
}
