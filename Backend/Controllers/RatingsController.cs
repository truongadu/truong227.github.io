using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/ratings")]
public class RatingsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<RatingsController> _logger;

    public RatingsController(CookingAppDbContext context, ILogger<RatingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRatings()
    {
        return Ok(await _context.Ratings.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> AddRating(Rating rating)
    {
        rating.CreatedAt = DateTime.Now;
        _context.Ratings.Add(rating);

        await _context.SaveChangesAsync();

        return Ok(rating);
    }

    [HttpGet("recipe/{recipeId}")]
    public async Task<IActionResult> GetRecipeRating(int recipeId)
    {
        var ratings = await _context.Ratings
            .Where(r => r.RecipeId == recipeId)
            .ToListAsync();

        if (!ratings.Any())
        {
            return Ok(new
            {
                AverageRating = 0
            });
        }

        var average =
            ratings.Average(r => r.Score);

        return Ok(new
        {
            AverageRating = Math.Round(average, 1),
            Count = ratings.Count
        });
    }
}