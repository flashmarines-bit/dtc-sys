using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResubmissionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxResubmissions",
                table: "PendingVendorRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentSubmissionId",
                table: "PendingVendorRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResubmissionCount",
                table: "PendingVendorRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_ParentSubmissionId",
                table: "PendingVendorRequests",
                column: "ParentSubmissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_PendingVendorRequests_PendingVendorRequests_ParentSubmissio~",
                table: "PendingVendorRequests",
                column: "ParentSubmissionId",
                principalTable: "PendingVendorRequests",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PendingVendorRequests_PendingVendorRequests_ParentSubmissio~",
                table: "PendingVendorRequests");

            migrationBuilder.DropIndex(
                name: "IX_PendingVendorRequests_ParentSubmissionId",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "MaxResubmissions",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "ParentSubmissionId",
                table: "PendingVendorRequests");

            migrationBuilder.DropColumn(
                name: "ResubmissionCount",
                table: "PendingVendorRequests");
        }
    }
}
