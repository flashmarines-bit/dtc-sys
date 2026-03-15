using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnForRevisionAndSla : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReturnNotes",
                table: "PendingVendorRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnedAt",
                table: "PendingVendorRequests",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReturnNotes",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "ReturnedAt",
                table: "PendingVendorRequests");
        }
    }
}
