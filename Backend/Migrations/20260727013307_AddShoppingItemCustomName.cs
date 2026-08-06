using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CookingApp.API.Migrations
{
    public partial class AddShoppingItemCustomName : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomName",
                table: "ShoppingListItems",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomName",
                table: "ShoppingListItems");
        }
    }
}
