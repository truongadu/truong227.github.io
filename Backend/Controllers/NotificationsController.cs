using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly CookingAppDbContext _context;

    public NotificationsController(CookingAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetCounts(int userId)
    {
        var friendRequests = await _context.Friends
            .CountAsync(f => f.FriendUserId == userId && f.Status == "pending");

        var unreadShares = await _context.SharedRecipes
            .CountAsync(s => s.ToUserId == userId && !s.IsRead);

        return Ok(new
        {
            FriendRequests = friendRequests,
            UnreadShares = unreadShares,
            Total = friendRequests + unreadShares
        });
    }
}
