using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CookingApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPricingAndIngredientCost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EatingOutPrice",
                table: "Recipes",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalIngredientCost",
                table: "Recipes",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Ingredients",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EatingOutPrice",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "TotalIngredientCost",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Ingredients");
        }
    }
}
