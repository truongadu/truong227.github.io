using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/recipeingredients")]
public class RecipeIngredientsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<RecipeIngredientsController> _logger;

    public RecipeIngredientsController(CookingAppDbContext context, ILogger<RecipeIngredientsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.RecipeIngredients.ToListAsync());
    }

[HttpPost]
public async Task<IActionResult> Create(RecipeIngredient item)
{
    _context.RecipeIngredients.Add(item);
    await _context.SaveChangesAsync();

    return Ok(item);
}

[HttpGet("recipe/{recipeId}")]
public async Task<IActionResult> GetByRecipe(int recipeId)
{
    var items = await _context.RecipeIngredients
        .Where(ri => ri.RecipeId == recipeId)
        .Join(_context.Ingredients,
            ri => ri.IngredientId,
            i => i.IngredientId,
            (ri, i) => new
            {
                ri.RecipeIngredientId,
                ri.RecipeId,
                ri.IngredientId,
                IngredientName = i.IngredientName,
                ri.Quantity
            })
        .ToListAsync();

    return Ok(items);
}
}