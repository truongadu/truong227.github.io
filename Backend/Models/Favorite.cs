namespace CookingApp.API.Models;

public class Favorite
{
    public int FavoriteId { get; set; }

    public int UserId { get; set; }

    public int RecipeId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}