using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/favorites")]
public class FavoritesController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<FavoritesController> _logger;

    public FavoritesController(CookingAppDbContext context, ILogger<FavoritesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/favorites
    [HttpGet]
    public async Task<IActionResult> GetFavorites()
        => Ok(await _context.Favorites.ToListAsync());

    // GET: api/favorites/user/{userId}
    // Lay danh sach yeu thich cua user
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserFavorites(int userId)
    {
        var favorites = await _context.Favorites
            .Where(f => f.UserId == userId)
            .ToListAsync();
        return Ok(favorites);
    }

    // POST: api/favorites
    // Them vao yeu thich
    [HttpPost]
    public async Task<IActionResult> AddFavorite([FromBody] Favorite favorite)
    {
        var existing = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == favorite.UserId
                                   && f.RecipeId == favorite.RecipeId);
        if (existing != null)
            return BadRequest(new { Message = "Da co trong danh sach yeu thich" });

        favorite.CreatedAt = DateTime.Now;

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync();
        return Ok(favorite);
    }

    // DELETE: api/favorites/{id}
    // Xoa yeu thich theo FavoriteId
    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveFavorite(int id)
    {
        var fav = await _context.Favorites.FindAsync(id);
        if (fav == null) return NotFound();

        _context.Favorites.Remove(fav);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/favorites/user/{userId}/recipe/{recipeId}
    // Xoa yeu thich theo UserId + RecipeId (toggle-friendly)
    [HttpDelete("user/{userId}/recipe/{recipeId}")]
    public async Task<IActionResult> RemoveFavoriteByUserAndRecipe(int userId, int recipeId)
    {
        var fav = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.RecipeId == recipeId);
        if (fav == null) return NotFound();

        _context.Favorites.Remove(fav);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}