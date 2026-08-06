using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(CookingAppDbContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/products
    // Lay tat ca san pham dang ban (kem ten cong thuc, anh)
    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await (
            from p in _context.Products
            join r in _context.Recipes on p.RecipeId equals r.RecipeId
            select new
            {
                p.ProductId,
                p.RecipeId,
                p.UserId,
                p.Price,
                p.Unit,
                p.Description,
                p.IsAvailable,
                p.TotalSold,
                p.CreatedAt,
                p.UpdatedAt,
                RecipeName = r.RecipeName,
                ImageUrl = r.ImageUrl
            }).ToListAsync();

        return Ok(products);
    }

    // GET: api/products/{id}
    // Lay san pham theo id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    // GET: api/products/recipe/{recipeId}
    // Lay san pham dang ban theo cong thuc (dung cho SellerPanel)
    [HttpGet("recipe/{recipeId}")]
    public async Task<IActionResult> GetByRecipe(int recipeId)
    {
        var product = await (
            from p in _context.Products
            join r in _context.Recipes on p.RecipeId equals r.RecipeId
            where p.RecipeId == recipeId
            select new
            {
                p.ProductId,
                p.RecipeId,
                p.UserId,
                p.Price,
                p.Unit,
                p.Description,
                p.IsAvailable,
                p.TotalSold,
                p.CreatedAt,
                p.UpdatedAt,
                RecipeName = r.RecipeName,
                ImageUrl = r.ImageUrl
            }).FirstOrDefaultAsync();

        if (product == null) return NotFound();
        return Ok(product);
    }

    // GET: api/products/seller/{userId}
    [HttpGet("seller/{userId}")]
    public async Task<IActionResult> GetBySeller(int userId)
    {
        return await GetByUser(userId);
    }

    // GET: api/products/user/{userId}
    // Lay tat ca san pham dang ban cua mot nguoi ban
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var products = await (
            from p in _context.Products
            join r in _context.Recipes on p.RecipeId equals r.RecipeId
            where p.UserId == userId
            select new
            {
                p.ProductId,
                p.RecipeId,
                p.UserId,
                p.Price,
                p.Unit,
                p.Description,
                p.IsAvailable,
                p.TotalSold,
                p.CreatedAt,
                p.UpdatedAt,
                RecipeName = r.RecipeName,
                ImageUrl = r.ImageUrl
            }).ToListAsync();

        return Ok(products);
    }

    // POST: api/products
    // Dang ban mot cong thuc (tao san pham moi) — chi user rank Bach Kim tro len
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        var recipeExists = await _context.Recipes
            .AnyAsync(r => r.RecipeId == product.RecipeId);
        if (!recipeExists)
        {
            return BadRequest(new { Message = $"Công thức (RecipeId = {product.RecipeId}) không tồn tại" });
        }

        var userExists = await _context.Users.AnyAsync(u => u.UserId == product.UserId);
        if (!userExists)
        {
            return BadRequest(new { Message = $"Người dùng (UserId = {product.UserId}) không tồn tại" });
        }

        // Kiem tra rank: chi user co >= 50 likes (Dau bep tai gia) moi duoc dang ban
        var recipeIds = await _context.Recipes
            .Where(r => r.UserId == product.UserId)
            .Select(r => r.RecipeId)
            .ToListAsync();

        var totalLikes = await _context.Favorites
            .CountAsync(f => recipeIds.Contains(f.RecipeId));

        if (totalLikes < 50)
        {
            return BadRequest(new { Message = "Bạn cần đạt danh hiệu Đầu bếp tại gia (50 lượt yêu thích) trở lên để đăng bán sản phẩm" });
        }

        // Kiem tra nguoi ban da co tai khoan ngan hang chua
        var hasBankAccount = await _context.Set<BankAccount>()
            .AnyAsync(b => b.UserId == product.UserId && !string.IsNullOrWhiteSpace(b.AccountNumber));
        if (!hasBankAccount)
        {
            return BadRequest(new { Message = "Bạn cần thêm thông tin tài khoản ngân hàng trong Hồ sơ trước khi đăng bán" });
        }

        var alreadyExists = await _context.Products
            .AnyAsync(p => p.RecipeId == product.RecipeId);
        if (alreadyExists)
        {
            return BadRequest(new { Message = "Công thức này đã được đăng bán rồi" });
        }

        if (product.Price <= 0)
        {
            return BadRequest(new { Message = "Giá bán phải lớn hơn 0" });
        }

        product.CreatedAt = DateTime.Now;
        product.UpdatedAt = DateTime.Now;
        product.TotalSold = 0;

        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return Ok(product);
    }

    // PUT: api/products/{id}
    // Cap nhat tung phan san pham (gia, don vi, mo ta, trang thai con hang)
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductUpdateRequest updated)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        if (updated.Price.HasValue)
        {
            if (updated.Price.Value <= 0)
                return BadRequest(new { Message = "Giá bán phải lớn hơn 0" });
            product.Price = updated.Price.Value;
        }
        if (updated.Unit != null) product.Unit = updated.Unit;
        if (updated.Description != null) product.Description = updated.Description;
        if (updated.IsAvailable.HasValue) product.IsAvailable = updated.IsAvailable.Value;

        product.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    // DELETE: api/products/{id}
    // Ngung ban / xoa san pham
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
