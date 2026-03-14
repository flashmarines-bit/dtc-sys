using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLibraryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Map string enum values to integers before casting
            migrationBuilder.Sql("UPDATE \"Documents\" SET \"StorageStage\" = CASE \"StorageStage\" WHEN 'Temp' THEN '0' WHEN 'Quarantine' THEN '1' WHEN 'Archive' THEN '2' ELSE '0' END");
            migrationBuilder.Sql("ALTER TABLE \"Documents\" ALTER COLUMN \"StorageStage\" TYPE integer USING \"StorageStage\"::integer");

            migrationBuilder.Sql("UPDATE \"Documents\" SET \"Status\" = CASE \"Status\" WHEN 'Draft' THEN '0' WHEN 'Submitted' THEN '1' WHEN 'Received' THEN '2' WHEN 'Assigned' THEN '3' WHEN 'UnderReview' THEN '4' WHEN 'Approved' THEN '5' WHEN 'Returned' THEN '6' WHEN 'Rejected' THEN '7' WHEN 'Archived' THEN '8' ELSE '0' END");
            migrationBuilder.Sql("ALTER TABLE \"Documents\" ALTER COLUMN \"Status\" TYPE integer USING \"Status\"::integer");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLibraryDocument",
                table: "Documents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LibraryApprovedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LibraryRejectionReason",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LibraryReviewedByUserId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LibraryStatus",
                table: "Documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_LibraryReviewedByUserId",
                table: "Documents",
                column: "LibraryReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_LibraryReviewedByUserId",
                table: "Documents",
                column: "LibraryReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_LibraryReviewedByUserId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_LibraryReviewedByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "IsLibraryDocument",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "LibraryApprovedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "LibraryRejectionReason",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "LibraryReviewedByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "LibraryStatus",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Documents");

            migrationBuilder.AlterColumn<string>(
                name: "StorageStage",
                table: "Documents",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Documents",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
