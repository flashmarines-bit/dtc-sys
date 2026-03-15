using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dtc.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddModule3VendorSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SignatoryConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SignatoryName = table.Column<string>(type: "text", nullable: false),
                    SignatoryTitle = table.Column<string>(type: "text", nullable: false),
                    NameAliases = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    NumberingFormat = table.Column<string>(type: "text", nullable: false),
                    SequencePadding = table.Column<int>(type: "integer", nullable: false),
                    DocumentTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationFunctionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignatoryConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SignatoryConfigs_DocumentTypes_DocumentTypeId",
                        column: x => x.DocumentTypeId,
                        principalTable: "DocumentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SignatoryConfigs_OrganizationFunctions_OrganizationFunction~",
                        column: x => x.OrganizationFunctionId,
                        principalTable: "OrganizationFunctions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PendingVendorRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmissionNumber = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    VendorCompanyName = table.Column<string>(type: "text", nullable: false),
                    VendorContactName = table.Column<string>(type: "text", nullable: false),
                    VendorContactEmail = table.Column<string>(type: "text", nullable: false),
                    VendorContactPhone = table.Column<string>(type: "text", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "text", nullable: true),
                    DocumentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DocumentValue = table.Column<decimal>(type: "numeric", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    OriginalStoragePath = table.Column<string>(type: "text", nullable: false),
                    SearchablePdfPath = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    PageCount = table.Column<int>(type: "integer", nullable: false),
                    DpiCheckResult = table.Column<int>(type: "integer", nullable: false),
                    DetectedDpi = table.Column<int>(type: "integer", nullable: true),
                    DetectedDocumentType = table.Column<string>(type: "text", nullable: true),
                    ExtractedText = table.Column<string>(type: "text", nullable: true),
                    ExtractedFieldsJson = table.Column<string>(type: "text", nullable: true),
                    DetectedSignatoryName = table.Column<string>(type: "text", nullable: true),
                    AiGrade = table.Column<int>(type: "integer", nullable: false),
                    AiScore = table.Column<int>(type: "integer", nullable: true),
                    AiSummary = table.Column<string>(type: "text", nullable: true),
                    AnalysisCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    AnalysisCompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnalysisErrorMessage = table.Column<string>(type: "text", nullable: true),
                    RejectionCategory = table.Column<int>(type: "integer", nullable: true),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    ValidatorNotes = table.Column<string>(type: "text", nullable: true),
                    ValidatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VendorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ValidatorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    SignatoryConfigId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResultDocumentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingVendorRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PendingVendorRequests_DocumentTypes_DocumentTypeId",
                        column: x => x.DocumentTypeId,
                        principalTable: "DocumentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PendingVendorRequests_Documents_ResultDocumentId",
                        column: x => x.ResultDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PendingVendorRequests_SignatoryConfigs_SignatoryConfigId",
                        column: x => x.SignatoryConfigId,
                        principalTable: "SignatoryConfigs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PendingVendorRequests_Users_ValidatorUserId",
                        column: x => x.ValidatorUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PendingVendorRequests_Users_VendorUserId",
                        column: x => x.VendorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_DocumentTypeId",
                table: "PendingVendorRequests",
                column: "DocumentTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_ResultDocumentId",
                table: "PendingVendorRequests",
                column: "ResultDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_SignatoryConfigId",
                table: "PendingVendorRequests",
                column: "SignatoryConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_ValidatorUserId",
                table: "PendingVendorRequests",
                column: "ValidatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingVendorRequests_VendorUserId",
                table: "PendingVendorRequests",
                column: "VendorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SignatoryConfigs_DocumentTypeId",
                table: "SignatoryConfigs",
                column: "DocumentTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_SignatoryConfigs_OrganizationFunctionId",
                table: "SignatoryConfigs",
                column: "OrganizationFunctionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PendingVendorRequests");

            migrationBuilder.DropTable(
                name: "SignatoryConfigs");
        }
    }
}
