using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(CookingAppDbContext context, ILogger<CategoriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories.ToListAsync();
        return Ok(categories);
    }

}