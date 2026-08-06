using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/sharedrecipes")]
public class SharedRecipesController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<SharedRecipesController> _logger;

    public SharedRecipesController(CookingAppDbContext context, ILogger<SharedRecipesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/sharedrecipes/inbox/{userId}
    // Lay danh sach cong thuc duoc chia se den nguoi dung
    [HttpGet("inbox/{userId}")]
    public async Task<IActionResult> GetInbox(int userId)
    {
        var shared = await _context.SharedRecipes
            .Where(s => s.ToUserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(shared);
    }

    // GET: api/sharedrecipes/sent/{userId}
    // Lay danh sach cong thuc da chia se di
    [HttpGet("sent/{userId}")]
    public async Task<IActionResult> GetSent(int userId)
    {
        var shared = await _context.SharedRecipes
            .Where(s => s.FromUserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(shared);
    }

    // POST: api/sharedrecipes
    // Chia se cong thuc
    [HttpPost]
    public async Task<IActionResult> ShareRecipe([FromBody] SharedRecipe share)
    {
        share.CreatedAt = DateTime.Now;
        share.IsRead = false;
        _context.SharedRecipes.Add(share);
        await _context.SaveChangesAsync();
        return Ok(share);
    }

    // PUT: api/sharedrecipes/{id}/read
    // Danh dau da doc
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var share = await _context.SharedRecipes.FindAsync(id);
        if (share == null) return NotFound();

        share.IsRead = true;
        await _context.SaveChangesAsync();
        return Ok(share);
    }

    // DELETE: api/sharedrecipes/{id}
    // Xoa chia se
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteShare(int id)
    {
        var share = await _context.SharedRecipes.FindAsync(id);
        if (share == null) return NotFound();

        _context.SharedRecipes.Remove(share);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}