using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhysicalTrackingStateMachine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AcknowledgedAt",
                table: "DocumentTrackings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AcknowledgedByUserId",
                table: "DocumentTrackings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActionContext",
                table: "DocumentTrackings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAcknowledged",
                table: "DocumentTrackings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhotoPath",
                table: "DocumentTrackings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresAck",
                table: "DocumentTrackings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentHolderId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DropOffAcknowledgedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DropOffAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DropOffByUserId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DropOffPhotoPath",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EscalationSent",
                table: "Documents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FrontDeskReceivedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupOtpCode",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupOtpExpiresAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupOtpVerifiedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PickupVerifiedByUserId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PreArrivalDeclaredAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnCompletedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnInitiatedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SlaBreached",
                table: "Documents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaDeadlineAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaStartedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetDepartment",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VendorContactEmail",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VendorContactPhone",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VendorPicName",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifikatorReceivedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTrackings_AcknowledgedByUserId",
                table: "DocumentTrackings",
                column: "AcknowledgedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CurrentHolderId",
                table: "Documents",
                column: "CurrentHolderId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DropOffByUserId",
                table: "Documents",
                column: "DropOffByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_CurrentHolderId",
                table: "Documents",
                column: "CurrentHolderId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_DropOffByUserId",
                table: "Documents",
                column: "DropOffByUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTrackings_Users_AcknowledgedByUserId",
                table: "DocumentTrackings",
                column: "AcknowledgedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_CurrentHolderId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_DropOffByUserId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTrackings_Users_AcknowledgedByUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropIndex(
                name: "IX_DocumentTrackings_AcknowledgedByUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropIndex(
                name: "IX_Documents_CurrentHolderId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_DropOffByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "AcknowledgedAt",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "AcknowledgedByUserId",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "ActionContext",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "IsAcknowledged",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "PhotoPath",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "RequiresAck",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "CurrentHolderId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "DropOffAcknowledgedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "DropOffAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "DropOffByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "DropOffPhotoPath",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "EscalationSent",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FrontDeskReceivedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PickupOtpCode",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PickupOtpExpiresAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PickupOtpVerifiedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PickupVerifiedByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PreArrivalDeclaredAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReturnCompletedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReturnInitiatedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "SlaBreached",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "SlaDeadlineAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "SlaStartedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "TargetDepartment",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "VendorContactEmail",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "VendorContactPhone",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "VendorPicName",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "VerifikatorReceivedAt",
                table: "Documents");
        }
    }
}
