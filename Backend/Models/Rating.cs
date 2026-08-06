namespace CookingApp.API.Models;

public class Rating
{
    public int RatingId { get; set; }
    public int UserId { get; set; }
    public int RecipeId { get; set; }
    public int Score { get; set; } // 1 -> 5
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}