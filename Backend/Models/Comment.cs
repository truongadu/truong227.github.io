namespace CookingApp.API.Models;

public class Comment
{
    public int CommentId { get; set; }
    public int UserId { get; set; }
    public int RecipeId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? FullName { get; set; }   // Ten user (denormalized)
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}