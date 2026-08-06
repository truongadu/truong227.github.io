using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CookingApp.API.Models;

public class RecipeStep
{
    [Key]
    public int StepId { get; set; }

    [ForeignKey("Recipe")]
    public int RecipeId { get; set; }

    public int StepNumber { get; set; }

    [Required]
    public string Instruction { get; set; } = string.Empty;

    public virtual Recipe? Recipe { get; set; }
}
