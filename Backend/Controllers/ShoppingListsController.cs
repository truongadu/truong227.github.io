using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/shoppinglists")]
public class ShoppingListsController : ControllerBase
{
    private readonly CookingAppDbContext _context;

    public ShoppingListsController(CookingAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetLists(int userId)
    {
        var lists = await _context.ShoppingLists
            .Where(l => l.UserId == userId)
            .Include(l => l.Items)
            .ThenInclude(i => i.Ingredient)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
        return Ok(lists);
    }

    [HttpPost]
    public async Task<IActionResult> CreateList([FromBody] ShoppingList list)
    {
        list.CreatedAt = DateTime.Now;
        _context.ShoppingLists.Add(list);
        await _context.SaveChangesAsync();
        return Ok(list);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteList(int id)
    {
        var list = await _context.ShoppingLists
            .Include(l => l.Items)
            .FirstOrDefaultAsync(l => l.ShoppingListId == id);
        if (list == null) return NotFound();
        _context.ShoppingLists.Remove(list);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{listId}/items")]
    public async Task<IActionResult> AddItem(int listId, [FromBody] ShoppingListItem item)
    {
        item.ShoppingListId = listId;
        item.IsPurchased = false;
        _context.ShoppingListItems.Add(item);
        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("items/{itemId}")]
    public async Task<IActionResult> UpdateItem(int itemId, [FromBody] ShoppingListItem updated)
    {
        var item = await _context.ShoppingListItems.FindAsync(itemId);
        if (item == null) return NotFound();
        item.Quantity = updated.Quantity;
        item.IsPurchased = updated.IsPurchased;
        if (updated.IngredientId.HasValue)
            item.IngredientId = updated.IngredientId;
        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> DeleteItem(int itemId)
    {
        var item = await _context.ShoppingListItems.FindAsync(itemId);
        if (item == null) return NotFound();
        _context.ShoppingListItems.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
