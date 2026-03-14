using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhysicalTrackingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTrackings_Users_ActedByUserId",
                table: "DocumentTrackings");

            // Clear existing tracking data (string values incompatible with new enum)
            migrationBuilder.Sql("TRUNCATE TABLE \"DocumentTrackings\" CASCADE");
            migrationBuilder.Sql("ALTER TABLE \"DocumentTrackings\" ALTER COLUMN \"Event\" TYPE integer USING 0");

            migrationBuilder.AddColumn<int>(
                name: "FromStatus",
                table: "DocumentTrackings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtpCode",
                table: "DocumentTrackings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OtpConfirmedAt",
                table: "DocumentTrackings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OtpExpiresAt",
                table: "DocumentTrackings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoProofPath",
                table: "DocumentTrackings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecipientUserId",
                table: "DocumentTrackings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ToStatus",
                table: "DocumentTrackings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AssignedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedToUserId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QrCode",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNumber",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnReason",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewStartedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VendorName",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SlaConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStatus = table.Column<int>(type: "integer", nullable: false),
                    ToStatus = table.Column<int>(type: "integer", nullable: false),
                    MaxDurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    DocumentTypeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlaConfigurations_DocumentTypes_DocumentTypeId",
                        column: x => x.DocumentTypeId,
                        principalTable: "DocumentTypes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTrackings_RecipientUserId",
                table: "DocumentTrackings",
                column: "RecipientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_AssignedToUserId",
                table: "Documents",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SlaConfigurations_DocumentTypeId",
                table: "SlaConfigurations",
                column: "DocumentTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_AssignedToUserId",
                table: "Documents",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTrackings_Users_ActedByUserId",
                table: "DocumentTrackings",
                column: "ActedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTrackings_Users_RecipientUserId",
                table: "DocumentTrackings",
                column: "RecipientUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_AssignedToUserId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTrackings_Users_ActedByUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTrackings_Users_RecipientUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropTable(
                name: "SlaConfigurations");

            migrationBuilder.DropIndex(
                name: "IX_DocumentTrackings_RecipientUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropIndex(
                name: "IX_Documents_AssignedToUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FromStatus",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "OtpCode",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "OtpConfirmedAt",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "OtpExpiresAt",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "PhotoProofPath",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "RecipientUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "ToStatus",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "AssignedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "QrCode",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReceivedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReferenceNumber",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReturnReason",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReviewStartedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "VendorName",
                table: "Documents");

            migrationBuilder.AlterColumn<string>(
                name: "Event",
                table: "DocumentTrackings",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTrackings_Users_ActedByUserId",
                table: "DocumentTrackings",
                column: "ActedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
