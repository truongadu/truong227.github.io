using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;
using CookingApp.API.Services;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        CookingAppDbContext context,
        JwtService jwtService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _logger = logger;
    }

    // REGISTER
   [HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterRequest request)
{
    var existingUser = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    if (existingUser != null)
    {
        return BadRequest(new
        {
            Message = "Email đã tồn tại"
        });
    }

    var user = new User
    {
        FullName = request.FullName,
        Email = request.Email,
        PasswordHash = request.Password
    };

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    var token = _jwtService.GenerateToken(
        user.UserId,
        user.Email,
        user.Role);

    return Ok(new
    {
        Message = "Đăng ký thành công",
        Token = token,
        UserId = user.UserId,
        FullName = user.FullName,
        Role = user.Role
    });
}

    // TEST
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok("Auth API OK");
    }
    [HttpPost("login")]
public async Task<IActionResult> Login(
    [FromBody] LoginRequest request)
{
    var user = await _context.Users
        .FirstOrDefaultAsync(u =>
            u.Email == request.Email &&
            u.PasswordHash == request.Password);

    if (user == null)
    {
        return BadRequest(new
        {
            Message = "Email hoặc mật khẩu không đúng"
        });
    }

    var token = _jwtService.GenerateToken(
        user.UserId,
        user.Email,
        user.Role);

    return Ok(new
    {
        Token = token,
        UserId = user.UserId,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        AvatarUrl = user.AvatarUrl
    });
}
}