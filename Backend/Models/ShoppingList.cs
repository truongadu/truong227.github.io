using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CookingApp.API.Models;

public class ShoppingList
{
    [Key]
    public int ShoppingListId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }

    [Required]
    public string ListName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual User? User { get; set; }
    public virtual ICollection<ShoppingListItem> Items { get; set; } = new List<ShoppingListItem>();
}
