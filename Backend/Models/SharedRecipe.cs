using System.ComponentModel.DataAnnotations;

namespace CookingApp.API.Models;

public class SharedRecipe
{
    [Key]
    public int ShareId { get; set; }
    public int FromUserId { get; set; }
    public int ToUserId { get; set; }
    public int RecipeId { get; set; }
    public string? Message { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}