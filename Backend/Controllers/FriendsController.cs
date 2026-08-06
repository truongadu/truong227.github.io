using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/friends")]
public class FriendsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<FriendsController> _logger;

    public FriendsController(CookingAppDbContext context, ILogger<FriendsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/friends/user/{userId}
    // Lay danh sach ban be da chap nhan
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetFriends(int userId)
    {
        var friends = await _context.Friends
            .Where(f => (f.UserId == userId || f.FriendUserId == userId)
                     && f.Status == "accepted")
            .ToListAsync();
        return Ok(friends);
    }

    // GET: api/friends/requests/{userId}
    // Lay danh sach loi moi ket ban dang cho duyet
    [HttpGet("requests/{userId}")]
    public async Task<IActionResult> GetPendingRequests(int userId)
    {
        var requests = await _context.Friends
            .Where(f => f.FriendUserId == userId && f.Status == "pending")
            .ToListAsync();
        return Ok(requests);
    }

    // POST: api/friends
    // Gui loi moi ket ban
    [HttpPost]
    public async Task<IActionResult> SendRequest([FromBody] Friend request)
    {
        var existing = await _context.Friends.FirstOrDefaultAsync(f =>
            (f.UserId == request.UserId && f.FriendUserId == request.FriendUserId) ||
            (f.UserId == request.FriendUserId && f.FriendUserId == request.UserId));

        if (existing != null)
            return BadRequest(new { Message = "Yeu cau da ton tai" });

        request.Status = "pending";
        request.CreatedAt = DateTime.Now;
        _context.Friends.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    // PUT: api/friends/{id}
    // Chap nhan hoac tu choi loi moi ket ban
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] Friend update)
    {
        var req = await _context.Friends.FindAsync(id);
        if (req == null) return NotFound();

        req.Status = update.Status; // "accepted" hoac "rejected"
        await _context.SaveChangesAsync();
        return Ok(req);
    }

    // DELETE: api/friends/{id}
    // Xoa ban be
    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveFriend(int id)
    {
        var req = await _context.Friends.FindAsync(id);
        if (req == null) return NotFound();

        _context.Friends.Remove(req);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}