using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/bank-accounts")]
public class BankAccountsController : ControllerBase
{
    private readonly CookingAppDbContext _context;

    public BankAccountsController(CookingAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var accounts = await _context.Set<BankAccount>()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.IsDefault)
            .ToListAsync();
        return Ok(accounts);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BankAccount account)
    {
        if (string.IsNullOrWhiteSpace(account.BankName))
            return BadRequest(new { Message = "Tên ngân hàng không được để trống" });
        if (string.IsNullOrWhiteSpace(account.AccountNumber))
            return BadRequest(new { Message = "Số tài khoản không được để trống" });
        if (string.IsNullOrWhiteSpace(account.AccountHolder))
            return BadRequest(new { Message = "Tên chủ tài khoản không được để trống" });

        if (account.IsDefault)
        {
            var existingDefault = await _context.Set<BankAccount>()
                .FirstOrDefaultAsync(b => b.UserId == account.UserId && b.IsDefault);
            if (existingDefault != null)
                existingDefault.IsDefault = false;
        }

        _context.Set<BankAccount>().Add(account);
        await _context.SaveChangesAsync();
        return Ok(account);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] BankAccount updated)
    {
        var account = await _context.Set<BankAccount>().FindAsync(id);
        if (account == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(updated.BankName))
            account.BankName = updated.BankName;
        if (!string.IsNullOrWhiteSpace(updated.AccountNumber))
            account.AccountNumber = updated.AccountNumber;
        if (!string.IsNullOrWhiteSpace(updated.AccountHolder))
            account.AccountHolder = updated.AccountHolder;
        if (updated.Branch != null)
            account.Branch = updated.Branch;

        if (updated.IsDefault && !account.IsDefault)
        {
            var existingDefault = await _context.Set<BankAccount>()
                .FirstOrDefaultAsync(b => b.UserId == account.UserId && b.IsDefault && b.BankAccountId != id);
            if (existingDefault != null)
                existingDefault.IsDefault = false;
            account.IsDefault = true;
        }

        await _context.SaveChangesAsync();
        return Ok(account);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var account = await _context.Set<BankAccount>().FindAsync(id);
        if (account == null) return NotFound();
        _context.Set<BankAccount>().Remove(account);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
