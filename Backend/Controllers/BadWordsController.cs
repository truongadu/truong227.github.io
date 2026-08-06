using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/badwords")]
public class BadWordsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<BadWordsController> _logger;

    public BadWordsController(CookingAppDbContext context, ILogger<BadWordsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetBadWords()
        => Ok(await _context.BadWords.OrderBy(b => b.Word).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> AddBadWord([FromBody] BadWord badWord)
    {
        if (string.IsNullOrWhiteSpace(badWord.Word))
            return BadRequest(new { Message = "Từ ngữ không được để trống" });

        badWord.Word = badWord.Word.Trim().ToLower();
        badWord.CreatedAt = DateTime.Now;

        var exists = await _context.BadWords.AnyAsync(b => b.Word == badWord.Word);
        if (exists)
            return BadRequest(new { Message = "Từ này đã tồn tại" });

        _context.BadWords.Add(badWord);
        await _context.SaveChangesAsync();
        return Ok(badWord);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBadWord(int id, [FromBody] BadWord updated)
    {
        var badWord = await _context.BadWords.FindAsync(id);
        if (badWord == null) return NotFound();

        if (string.IsNullOrWhiteSpace(updated.Word))
            return BadRequest(new { Message = "Từ ngữ không được để trống" });

        badWord.Word = updated.Word.Trim().ToLower();
        await _context.SaveChangesAsync();
        return Ok(badWord);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBadWord(int id)
    {
        var badWord = await _context.BadWords.FindAsync(id);
        if (badWord == null) return NotFound();

        _context.BadWords.Remove(badWord);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
