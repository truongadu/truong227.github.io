using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/comments")]
public class CommentsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(CookingAppDbContext context, ILogger<CommentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/comments
    [HttpGet]
    public async Task<IActionResult> GetComments()
        => Ok(await _context.Comments.ToListAsync());

    // GET: api/comments/recipe/{recipeId}?page=1&limit=10
    [HttpGet("recipe/{recipeId}")]
    public async Task<IActionResult> GetRecipeComments(int recipeId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        var total = await _context.Comments.CountAsync(c => c.RecipeId == recipeId);

        var comments = await _context.Comments
            .Where(c => c.RecipeId == recipeId)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        var userIds = comments.Select(c => c.UserId).Distinct().ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId);

        var result = comments.Select(c =>
        {
            var user = users.GetValueOrDefault(c.UserId);
            var userRecipeIds = _context.Recipes
                .Where(r => r.UserId == c.UserId)
                .Select(r => r.RecipeId)
                .ToList();
            var totalLikes = _context.Favorites
                .CountAsync(f => userRecipeIds.Contains(f.RecipeId)).Result;

            return new
            {
                c.CommentId,
                c.UserId,
                c.RecipeId,
                c.Content,
                c.FullName,
                AvatarUrl = user?.AvatarUrl,
                TotalLikes = totalLikes,
                c.CreatedAt
            };
        }).ToList();

        return Ok(new { Data = result, Total = total, Page = page, Limit = limit });
    }

    // POST: api/comments
    [HttpPost]
    public async Task<IActionResult> AddComment([FromBody] Comment comment)
    {
        comment.CreatedAt = DateTime.Now;

        if (string.IsNullOrEmpty(comment.FullName))
        {
            var user = await _context.Users.FindAsync(comment.UserId);
            comment.FullName = user?.FullName;
        }

        var badWords = await _context.BadWords.ToListAsync();
        var lowerContent = comment.Content.ToLower();
        foreach (var badWord in badWords)
        {
            if (lowerContent.Contains(badWord.Word))
            {
                return BadRequest(new
                {
                    Message = $"Bình luận chứa từ ngữ không phù hợp: {badWord.Word}"
                });
            }
        }

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return Ok(comment);
    }

    // PUT: api/comments/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateComment(int id, [FromBody] CommentUpdateRequest request)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null) return NotFound();

        if (comment.UserId != request.UserId)
            return BadRequest(new { Message = "Bạn không có quyền chỉnh sửa bình luận này" });

        comment.Content = request.Content;
        await _context.SaveChangesAsync();
        return Ok(comment);
    }

    // DELETE: api/comments/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id, [FromQuery] int userId)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null) return NotFound();

        var user = await _context.Users.FindAsync(userId);
        if (comment.UserId != userId && (user == null || user.Role != "Admin"))
            return BadRequest(new { Message = "Bạn không có quyền xoá bình luận này" });

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class CommentUpdateRequest
{
    public int UserId { get; set; }
    public string Content { get; set; } = "";
}