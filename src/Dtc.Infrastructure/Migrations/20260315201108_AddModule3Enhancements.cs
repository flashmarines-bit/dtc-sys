using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddModule3Enhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "PendingVendorRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DynamicData",
                table: "PendingVendorRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RelatedLibraryDocumentId",
                table: "PendingVendorRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_RelatedLibraryDocumentId",
                table: "PendingVendorRequests",
                column: "RelatedLibraryDocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_PendingVendorRequests_Documents_RelatedLibraryDocumentId",
                table: "PendingVendorRequests",
                column: "RelatedLibraryDocumentId",
                principalTable: "Documents",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PendingVendorRequests_Documents_RelatedLibraryDocumentId",
                table: "PendingVendorRequests");

            migrationBuilder.DropIndex(
                name: "IX_PendingVendorRequests_RelatedLibraryDocumentId",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "DynamicData",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "RelatedLibraryDocumentId",
                table: "PendingVendorRequests");
        }
    }
}
