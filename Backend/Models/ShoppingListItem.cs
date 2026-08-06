using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CookingApp.API.Models;

public class ShoppingListItem
{
    [Key]
    public int ItemId { get; set; }

    [ForeignKey("ShoppingList")]
    public int ShoppingListId { get; set; }

    [ForeignKey("Ingredient")]
    public int? IngredientId { get; set; }

    public double Quantity { get; set; }

    public bool IsPurchased { get; set; } = false;

    public string? CustomName { get; set; }

    public virtual ShoppingList? ShoppingList { get; set; }
    public virtual Ingredient? Ingredient { get; set; }
}
