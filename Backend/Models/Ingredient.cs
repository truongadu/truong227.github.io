namespace CookingApp.API.Models;

public class Ingredient
{
    public int IngredientId { get; set; }
    public string IngredientName { get; set; } = "";
    public decimal Price { get; set; } = 0;
}