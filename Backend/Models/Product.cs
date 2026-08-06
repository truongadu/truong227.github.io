using System.ComponentModel.DataAnnotations.Schema;

namespace CookingApp.API.Models;

public class Product
{
    public int ProductId { get; set; }

    public int RecipeId { get; set; }

    public int UserId { get; set; }        // Nguoi ban (chu cua recipe)

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public string Unit { get; set; } = "phần";

    public string? Description { get; set; }

    public bool IsAvailable { get; set; } = true;

    public int TotalSold { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
