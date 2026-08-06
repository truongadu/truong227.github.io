using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly CookingAppDbContext _context;

    public LeaderboardController(CookingAppDbContext context)
    {
        _context = context;
    }

    // GET: api/leaderboard/ratings?period=all|week|month|year
    // Top mon an theo diem danh gia trung binh
    [HttpGet("ratings")]
    public async Task<IActionResult> GetByRatings([FromQuery] string period = "all")
    {
        var query = from r in _context.Recipes
                    join rt in _context.Ratings on r.RecipeId equals rt.RecipeId into ratingsGroup
                    from rt in ratingsGroup.DefaultIfEmpty()
                    where r.Status == "approved"
                    select new { r, rt };

        if (period != "all")
        {
            var since = period switch
            {
                "week" => DateTime.Now.AddDays(-7),
                "month" => DateTime.Now.AddMonths(-1),
                "year" => DateTime.Now.AddYears(-1),
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

        var ranked = grouped
            .OrderByDescending(x => x.AverageRating ?? 0)
            .ThenByDescending(x => x.RatingCount)
            .ToList();

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

    // GET: api/leaderboard/favorites
    // Top mon an duoc yeu thich nhat
    [HttpGet("favorites")]
    public async Task<IActionResult> GetByFavorites()
    {
        var grouped = await _context.Favorites
            .GroupBy(f => f.RecipeId)
            .Select(g => new { RecipeId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(50)
            .ToListAsync();

        var recipeIds = grouped.Select(x => x.RecipeId);
        var recipes = await _context.Recipes
            .Where(r => recipeIds.Contains(r.RecipeId))
            .ToDictionaryAsync(r => r.RecipeId);

        var userIds = recipes.Values.Where(r => r.UserId.HasValue).Select(r => r.UserId!.Value).Distinct();
        var users = await _context.Users.Where(u => userIds.Contains(u.UserId)).ToDictionaryAsync(u => u.UserId, u => u.FullName);

        var result = grouped.Select(x => new
        {
            RecipeId = x.RecipeId,
            RecipeName = recipes.TryGetValue(x.RecipeId, out var r) ? r.RecipeName : "",
            ImageUrl = r?.ImageUrl,
            UserId = r?.UserId,
            SellerName = r?.UserId.HasValue == true && users.TryGetValue(r.UserId.Value, out var name) ? name : null,
            FavoriteCount = x.Count
        });

        return Ok(result);
    }

    // GET: api/leaderboard/best-selling
    // Top mon an ban chay nhat
    [HttpGet("best-selling")]
    public async Task<IActionResult> GetBestSelling()
    {
        var products = await _context.Products
            .Where(p => p.TotalSold > 0)
            .OrderByDescending(p => p.TotalSold)
            .Take(50)
            .ToListAsync();

        var recipeIds = products.Select(p => p.RecipeId);
        var recipes = await _context.Recipes
            .Where(r => recipeIds.Contains(r.RecipeId))
            .ToDictionaryAsync(r => r.RecipeId);

        var userIds = recipes.Values.Where(r => r.UserId.HasValue).Select(r => r.UserId!.Value).Distinct();
        var users = await _context.Users.Where(u => userIds.Contains(u.UserId)).ToDictionaryAsync(u => u.UserId, u => u.FullName);

        var result = products.Select(p =>
        {
            recipes.TryGetValue(p.RecipeId, out var r);
            return new
            {
                RecipeId = p.RecipeId,
                RecipeName = r?.RecipeName ?? "",
                ImageUrl = r?.ImageUrl,
                UserId = p.UserId,
                SellerName = users.TryGetValue(p.UserId, out var name) ? name : null,
                TotalSold = p.TotalSold,
                Price = p.Price
            };
        });

        return Ok(result);
    }

    // GET: api/leaderboard/master-chef?period=week|month|year|all
    // Top dau be theo diem = tong luot yeu thich + doanh thu / 100000
    [HttpGet("master-chef")]
    public async Task<IActionResult> GetMasterChef([FromQuery] string period = "all")
    {
        var allRecipes = await _context.Recipes
            .Where(r => r.Status == "approved")
            .ToListAsync();

        var userRecipeGroups = allRecipes
            .Where(r => r.UserId.HasValue)
            .GroupBy(r => r.UserId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(r => r.RecipeId).ToList());

        var userIds = userRecipeGroups.Keys.ToList();
        if (!userIds.Any())
            return Ok(Array.Empty<object>());

        var users = await _context.Users
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.FullName);
        var userAvatars = await _context.Users
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.AvatarUrl);

        // Dem tong likes cho moi user
        var allRecipeIds = userRecipeGroups.Values.SelectMany(x => x).ToList();
        var likesByRecipe = await _context.Favorites
            .Where(f => allRecipeIds.Contains(f.RecipeId))
            .GroupBy(f => f.RecipeId)
            .Select(g => new { RecipeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RecipeId, x => x.Count);

        // Tinh doanh thu tu don hang hoan thanh
        var productUserMap = await _context.Products
            .Where(p => userIds.Contains(p.UserId))
            .Select(p => new { p.ProductId, p.UserId })
            .ToDictionaryAsync(p => p.ProductId, p => p.UserId);

        var productIds = productUserMap.Keys.ToList();
        var ordersQuery = _context.Orders.Where(o => o.Status == "completed");

        if (period != "all")
        {
            var since = period switch
            {
                "week" => DateTime.Now.AddDays(-7),
                "month" => DateTime.Now.AddMonths(-1),
                "year" => DateTime.Now.AddYears(-1),
                _ => DateTime.MinValue
            };
            ordersQuery = ordersQuery.Where(o => o.UpdatedAt >= since);
        }

        var orderRevenueByProduct = await ordersQuery
            .Where(o => productIds.Contains(o.ProductId))
            .GroupBy(o => o.ProductId)
            .Select(g => new { ProductId = g.Key, Revenue = g.Sum(o => o.TotalPrice) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Revenue);

        // Tinh diem cho tung user
        var scores = userIds.Select(uid =>
        {
            var recipeIds = userRecipeGroups[uid];
            var totalLikes = recipeIds.Sum(rid => likesByRecipe.TryGetValue(rid, out var c) ? c : 0);
            var userProductIds = productUserMap
                .Where(kv => kv.Value == uid)
                .Select(kv => kv.Key)
                .ToList();
            var totalRevenue = userProductIds.Sum(pid => orderRevenueByProduct.TryGetValue(pid, out var rev) ? rev : 0);
            var score = totalLikes + (double)totalRevenue / 100000;

            return new
            {
                UserId = uid,
                FullName = users.TryGetValue(uid, out var name) ? name : "Ẩn danh",
                AvatarUrl = userAvatars.TryGetValue(uid, out var av) ? av : null,
                TotalLikes = totalLikes,
                TotalRevenue = totalRevenue,
                Score = Math.Round(score, 1)
            };
        })
        .OrderByDescending(s => s.Score)
        .Take(50)
        .ToList();

        return Ok(scores);
    }
}
