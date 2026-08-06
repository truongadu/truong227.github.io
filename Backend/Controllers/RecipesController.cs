using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/recipes")]
public class RecipesController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<RecipesController> _logger;

    public RecipesController(CookingAppDbContext context, ILogger<RecipesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/recipes
    // Lay tat ca cong thuc da duoc duyet, kem thong tin san pham va rank nguoi ban
    [HttpGet]
    public async Task<IActionResult> GetRecipes()
    {
        var recipes = await _context.Recipes.Where(r => r.Status == "approved").ToListAsync();

        var activeProductUserIds = await _context.Products
            .Where(p => p.IsAvailable)
            .Select(p => p.UserId)
            .Distinct()
            .ToListAsync();

        var recipeUserIds = recipes.Where(r => r.UserId.HasValue).Select(r => r.UserId!.Value).Distinct();
        var totalLikesPerUser = await _context.Favorites
            .Where(f => recipeUserIds.Contains(f.UserId))
            .GroupBy(f => f.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var rankThresholds = new[] {
            new { Rank = "bac_thay", Threshold = 500 },
            new { Rank = "nghe_nhan", Threshold = 200 },
            new { Rank = "dau_bep", Threshold = 50 },
            new { Rank = "nguoi_yeu", Threshold = 10 },
            new { Rank = "tap_su", Threshold = 0 },
        };

        var result = recipes.Select(r => new
        {
            r.RecipeId,
            r.RecipeName,
            r.Description,
            r.CategoryId,
            r.CookingTime,
            r.ImageUrl,
            r.UserId,
            r.Steps,
            r.Difficulty,
            r.Servings,
            r.NutritionInfo,
            r.Status,
            r.EatingOutPrice,
            r.TotalIngredientCost,
            HasActiveProduct = r.UserId.HasValue && activeProductUserIds.Contains(r.UserId.Value),
            SellerRank = r.UserId.HasValue && totalLikesPerUser.TryGetValue(r.UserId.Value, out var likes)
                ? rankThresholds.First(t => likes >= t.Threshold).Rank
                : "tap_su",
        });

        return Ok(result);
    }

    // GET: api/recipes/all
    // Admin: lay tat ca cong thuc (ke ca chua duyet)
    [HttpGet("all")]
    public async Task<IActionResult> GetAllRecipes()
        => Ok(await _context.Recipes.ToListAsync());

    // GET: api/recipes/{id}
    // Lay cong thuc theo id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRecipe(int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null) return NotFound();
        return Ok(recipe);
    }

    // POST: api/recipes/{id}/calculate-cost
    // Tinh tong chi phi nguyen lieu cho cong thuc dua tren Ingredient.Price
    [HttpPost("{id}/calculate-cost")]
    public async Task<IActionResult> CalculateCost(int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null) return NotFound();

        var ingredients = await (
            from ri in _context.RecipeIngredients
            join i in _context.Ingredients on ri.IngredientId equals i.IngredientId
            where ri.RecipeId == id
            select new { ri.Quantity, i.Price }
        ).ToListAsync();

        decimal total = 0;
        foreach (var ing in ingredients)
        {
            if (decimal.TryParse(ing.Quantity, out var qty))
                total += qty * ing.Price;
        }

        recipe.TotalIngredientCost = total;
        await _context.SaveChangesAsync();

        return Ok(new { recipe.RecipeId, recipe.TotalIngredientCost, recipe.EatingOutPrice });
    }

    // GET: api/recipes/leaderboard
    // Xep hang mon an theo luot danh gia cao nhat va nhieu nhat
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromQuery] string? period)
    {
        var query = from r in _context.Recipes
                    join rt in _context.Ratings on r.RecipeId equals rt.RecipeId into ratingsGroup
                    from rt in ratingsGroup.DefaultIfEmpty()
                    where r.Status == "approved"
                    select new { r, rt };

        // Loc theo thoi gian neu co
        if (!string.IsNullOrEmpty(period) && period != "all")
        {
            var now = DateTime.Now;
            DateTime since = period switch
            {
                "week" => now.AddDays(-7),
                "month" => now.AddMonths(-1),
                _ => DateTime.MinValue
            };
            query = query.Where(x => x.rt == null || x.rt.CreatedAt >= since);
        }

        var grouped = await query
            .GroupBy(x => new { x.r.RecipeId, x.r.RecipeName, x.r.ImageUrl, x.r.UserId })
            .Select(g => new
            {
                RecipeId = g.Key.RecipeId,
                RecipeName = g.Key.RecipeName,
                ImageUrl = g.Key.ImageUrl,
                UserId = g.Key.UserId,
                AverageRating = g.Average(x => x.rt != null ? (double?)x.rt.Score : null),
                RatingCount = g.Count(x => x.rt != null)
            })
            .ToListAsync();

        // Sap xep: diem danh gia TB cao nhat -> nhieu luot danh gia nhat
        var ranked = grouped
            .OrderByDescending(x => x.AverageRating ?? 0)
            .ThenByDescending(x => x.RatingCount)
            .ToList();

        // Lay ten nguoi ban
        var userIds = ranked.Where(x => x.UserId.HasValue).Select(x => x.UserId!.Value).Distinct();
        var users = await _context.Users.Where(u => userIds.Contains(u.UserId)).ToDictionaryAsync(u => u.UserId, u => u.FullName);

        var result = ranked.Select(x => new
        {
            x.RecipeId,
            x.RecipeName,
            x.ImageUrl,
            x.UserId,
            SellerName = x.UserId.HasValue && users.ContainsKey(x.UserId.Value) ? users[x.UserId.Value] : null,
            AverageRating = x.AverageRating.HasValue ? Math.Round(x.AverageRating.Value, 1) : (double?)null,
            RatingCount = x.RatingCount
        });

        return Ok(result);
    }

    // GET: api/recipes/user/{userId}
    // Lay cong thuc cua mot user
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var recipes = await _context.Recipes
            .Where(r => r.UserId == userId)
            .ToListAsync();
        return Ok(recipes);
    }

    // GET: api/recipes/trending
    // Lay cong thuc pho bien nhat (nhieu luot yeu thich nhat)
    [HttpGet("trending")]
    public async Task<IActionResult> GetTrending()
    {
        var topIds = await _context.Favorites
            .GroupBy(f => f.RecipeId)
            .Select(g => new { RecipeId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(6)
            .Select(x => x.RecipeId)
            .ToListAsync();

        if (!topIds.Any())
        {
            // Neu chua co favorites, tra ve 6 cong thuc moi nhat
            var latest = await _context.Recipes
                .OrderByDescending(r => r.RecipeId)
                .Take(6)
                .ToListAsync();
            return Ok(latest);
        }

        var recipes = await _context.Recipes
            .Where(r => topIds.Contains(r.RecipeId))
            .ToListAsync();

        // Sap xep theo thu tu luot yeu thich giam dan
        var ordered = topIds
            .Select(id => recipes.FirstOrDefault(r => r.RecipeId == id))
            .Where(r => r != null)
            .ToList();

        return Ok(ordered);
    }

    // GET: api/recipes/pending
    // Lay danh sach cong thuc cho duyet
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingRecipes()
    {
        var recipes = await _context.Recipes
            .Where(r => r.Status == "pending")
            .ToListAsync();
        return Ok(recipes);
    }

    // POST: api/recipes
    // Tao cong thuc moi
    [HttpPost]
    public async Task<IActionResult> CreateRecipe([FromBody] Recipe recipe)
    {
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.CategoryId == recipe.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new
            {
                Message = $"Danh mục (CategoryId = {recipe.CategoryId}) không tồn tại"
            });
        }

        recipe.Status = "pending";
        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync();
        return Ok(recipe);
    }

    // PUT: api/recipes/{id}
    // Cap nhat cong thuc
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecipe(int id, [FromBody] Recipe updated)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null) return NotFound();

        recipe.RecipeName = updated.RecipeName;
        recipe.Description = updated.Description;
        recipe.CategoryId = updated.CategoryId;
        recipe.CookingTime = updated.CookingTime;
        recipe.ImageUrl = updated.ImageUrl;
        recipe.Steps = updated.Steps;
        recipe.Difficulty = updated.Difficulty;
        recipe.Servings = updated.Servings;
        recipe.NutritionInfo = updated.NutritionInfo;
        recipe.Status = updated.Status ?? recipe.Status;

        await _context.SaveChangesAsync();
        return Ok(recipe);
    }

    // PUT: api/recipes/{id}/approve
    // Duyet cong thuc
    [HttpPut("{id}/approve")]
    public async Task<IActionResult> ApproveRecipe(int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null) return NotFound();

        recipe.Status = "approved";
        await _context.SaveChangesAsync();
        return Ok(recipe);
    }

    // PUT: api/recipes/{id}/reject
    // Tu choi cong thuc
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> RejectRecipe(int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null) return NotFound();

        recipe.Status = "rejected";
        await _context.SaveChangesAsync();
        return Ok(recipe);
    }

    // DELETE: api/recipes/{id}
    // Xoa cong thuc (xoa ca du lieu lien quan)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecipe(int id)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null) return NotFound();

        // Xoa cac ban ghi lien quan de tranh loi khoa ngoai
        var comments = _context.Comments.Where(c => c.RecipeId == id);
        _context.Comments.RemoveRange(comments);

        var ratings = _context.Ratings.Where(r => r.RecipeId == id);
        _context.Ratings.RemoveRange(ratings);

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}