using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CookingApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBankQrCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QrCodeUrl",
                table: "BankAccounts",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QrCodeUrl",
                table: "BankAccounts");
        }
    }
}
