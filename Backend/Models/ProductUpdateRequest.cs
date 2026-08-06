namespace CookingApp.API.Models;

// Dung rieng cho PUT /api/products/{id}
// Cac truong deu nullable de ho tro cap nhat tung phan (partial update)
public class ProductUpdateRequest
{
    public decimal? Price { get; set; }
    public string? Unit { get; set; }
    public string? Description { get; set; }
    public bool? IsAvailable { get; set; }
}
