namespace CookingApp.API.Models;

public class Recipe
{
    public int RecipeId { get; set; }
    public string RecipeName { get; set; } = "";
    public string Description { get; set; } = "";
    public int CategoryId { get; set; }
    public int CookingTime { get; set; }
    public string ImageUrl { get; set; } = "";
    public int? UserId { get; set; }
    public string? Steps { get; set; }       // JSON string chua cac buoc nau an
    public string? Difficulty { get; set; }  // Easy | Medium | Hard
    public int? Servings { get; set; }
    public string? NutritionInfo { get; set; } // JSON: {calories, protein, carbs, fat,...}
    public string Status { get; set; } = "approved"; // pending | approved | rejected
    public decimal EatingOutPrice { get; set; } = 0; // giá món này nếu mua ngoài hàng
    public decimal TotalIngredientCost { get; set; } = 0; // tổng chi phí nguyên liệu nếu nấu tại nhà
}