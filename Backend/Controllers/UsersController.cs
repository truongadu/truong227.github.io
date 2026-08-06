using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;
using Microsoft.AspNetCore.Authorization;
namespace CookingApp.API.Controllers;

//[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(CookingAppDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        return Ok(await _context.Users.ToListAsync());
    }
[HttpGet("{id}")]
public async Task<IActionResult> GetUser(int id)
{
    var user = await _context.Users.FindAsync(id);

    if (user == null)
        return NotFound();

    return Ok(user);
}

[HttpGet("{id}/rank")]
public async Task<IActionResult> GetUserRank(int id)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null) return NotFound();

    var recipeIds = await _context.Recipes
        .Where(r => r.UserId == id)
        .Select(r => r.RecipeId)
        .ToListAsync();

    var totalLikes = await _context.Favorites
        .CountAsync(f => recipeIds.Contains(f.RecipeId));

    var ranks = new[]
    {
        new { Rank = "tap_su",   Label = "Tập sự vào bếp ⭐",        Threshold = 0 },
        new { Rank = "nguoi_yeu", Label = "Người yêu ẩm thực ⭐⭐",  Threshold = 10 },
        new { Rank = "dau_bep",  Label = "Đầu bếp tại gia ⭐⭐⭐",   Threshold = 50 },
        new { Rank = "nghe_nhan", Label = "Nghệ nhân ẩm thực ⭐⭐⭐⭐", Threshold = 200 },
        new { Rank = "bac_thay", Label = "Bậc thầy nấu nướng ⭐⭐⭐⭐⭐", Threshold = 500 },
    };

    var currentRank = ranks.LastOrDefault(r => totalLikes >= r.Threshold) ?? ranks[0];
    var nextRank = ranks.FirstOrDefault(r => r.Threshold > currentRank.Threshold);
    var isMaxRank = nextRank == null;

    double progress = 0;
    if (!isMaxRank)
    {
        var range = nextRank!.Threshold - currentRank.Threshold;
        var current = totalLikes - currentRank.Threshold;
        progress = range > 0 ? Math.Round((double)current / range * 100, 1) : 0;
    }
    else
    {
        progress = 100;
    }

    return Ok(new UserRankResponse
    {
        UserId = user.UserId,
        FullName = user.FullName,
        Rank = currentRank.Rank,
        Label = currentRank.Label,
        TotalLikes = totalLikes,
        CurrentThreshold = currentRank.Threshold,
        NextThreshold = nextRank?.Threshold,
        Progress = progress,
        IsMaxRank = isMaxRank
    });
}

[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUser(int id)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null) return NotFound();

    _context.Users.Remove(user);
    await _context.SaveChangesAsync();
    return NoContent();
}

[HttpPut("{id}")]
public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateRequest request)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null) return NotFound();

    if (!string.IsNullOrEmpty(request.FullName))
        user.FullName = request.FullName;

    if (!string.IsNullOrEmpty(request.AvatarUrl))
        user.AvatarUrl = request.AvatarUrl;

    if (!string.IsNullOrEmpty(request.NewPassword))
    {
        if (string.IsNullOrEmpty(request.ConfirmPassword) || request.NewPassword != request.ConfirmPassword)
            return BadRequest(new { Message = "Mật khẩu xác nhận không khớp" });

        if (string.IsNullOrEmpty(request.CurrentPassword))
            return BadRequest(new { Message = "Vui lòng nhập mật khẩu hiện tại" });

        if (user.PasswordHash != request.CurrentPassword)
            return BadRequest(new { Message = "Mật khẩu hiện tại không đúng" });

        user.PasswordHash = request.NewPassword;
    }

    await _context.SaveChangesAsync();
    return Ok(new { user.FullName, user.Email, user.Role, user.AvatarUrl });
}

public class UserUpdateRequest
{
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
    public string? ConfirmPassword { get; set; }
}
}