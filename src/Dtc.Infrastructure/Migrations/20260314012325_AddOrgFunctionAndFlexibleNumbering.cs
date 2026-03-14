using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgFunctionAndFlexibleNumbering : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationFunctionId",
                table: "NumberingRecords",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationFunctionId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OrganizationFunctions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Suffix = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationFunctions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NumberingRecords_OrganizationFunctionId",
                table: "NumberingRecords",
                column: "OrganizationFunctionId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_OrganizationFunctionId",
                table: "Documents",
                column: "OrganizationFunctionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_OrganizationFunctions_OrganizationFunctionId",
                table: "Documents",
                column: "OrganizationFunctionId",
                principalTable: "OrganizationFunctions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NumberingRecords_OrganizationFunctions_OrganizationFunction~",
                table: "NumberingRecords",
                column: "OrganizationFunctionId",
                principalTable: "OrganizationFunctions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_OrganizationFunctions_OrganizationFunctionId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_NumberingRecords_OrganizationFunctions_OrganizationFunction~",
                table: "NumberingRecords");

            migrationBuilder.DropTable(
                name: "OrganizationFunctions");

            migrationBuilder.DropIndex(
                name: "IX_NumberingRecords_OrganizationFunctionId",
                table: "NumberingRecords");

            migrationBuilder.DropIndex(
                name: "IX_Documents_OrganizationFunctionId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "OrganizationFunctionId",
                table: "NumberingRecords");

            migrationBuilder.DropColumn(
                name: "OrganizationFunctionId",
                table: "Documents");
        }
    }
}
