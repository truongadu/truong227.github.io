namespace CookingApp.API.Models;

public class RecipeIngredient
{
    public int RecipeIngredientId { get; set; }

    public int RecipeId { get; set; }

    public int IngredientId { get; set; }

    public string Quantity { get; set; } = string.Empty;
}