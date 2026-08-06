using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CookingApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentProof : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentProofUrl",
                table: "Orders",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentProofUrl",
                table: "Orders");
        }
    }
}
