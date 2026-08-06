using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly CookingAppDbContext _context;

    public AdminController(CookingAppDbContext context)
    {
        _context = context;
    }

    [HttpPost("faker/create")]
    public async Task<IActionResult> CreateFakers([FromBody] CreateFakerRequest request)
    {
        if (request.Count < 1 || request.Count > 1000)
            return BadRequest(new { Message = "Số lượng phải từ 1 đến 1000" });

        var existingFakers = await _context.Users
            .Where(u => u.Email.StartsWith("faker"))
            .Select(u => u.Email)
            .ToListAsync();

        var existingNumbers = existingFakers
            .Select(e =>
            {
                var numStr = e.Replace("faker", "").Replace("@facecook.com", "");
                return int.TryParse(numStr, out var n) ? n : 0;
            })
            .Where(n => n > 0)
            .ToList();

        int nextId = existingNumbers.Any() ? existingNumbers.Max() + 1 : 1;

        var created = new List<User>();
        for (int i = 0; i < request.Count; i++)
        {
            var user = new User
            {
                FullName = $"Faker {nextId}",
                Email = $"faker{nextId}@facecook.com",
                PasswordHash = "123456",
                Role = "User"
            };
            _context.Users.Add(user);
            created.Add(user);
            nextId++;
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            Message = $"Đã tạo {request.Count} tài khoản faker",
            Created = created.Select(u => new { u.UserId, u.FullName, u.Email }).ToList()
        });
    }
}

public class CreateFakerRequest
{
    public int Count { get; set; }
}
