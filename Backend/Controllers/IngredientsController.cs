using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/ingredients")]
public class IngredientsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<IngredientsController> _logger;

    public IngredientsController(CookingAppDbContext context, ILogger<IngredientsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetIngredients()
    {
        var ingredients = await _context.Ingredients.ToListAsync();
        return Ok(ingredients);
    }
}