using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;

namespace CookingApp.API.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly CookingAppDbContext _context;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(CookingAppDbContext context, ILogger<OrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Truy van co join them ten cong thuc, ten nguoi mua/ban, anh
    private IQueryable<OrderDto> JoinedOrders()
    {
        return from o in _context.Orders
               join p in _context.Products on o.ProductId equals p.ProductId
               join r in _context.Recipes on p.RecipeId equals r.RecipeId
               join buyer in _context.Users on o.BuyerUserId equals buyer.UserId
               join seller in _context.Users on o.SellerUserId equals seller.UserId
                select new OrderDto
                {
                    OrderId = o.OrderId,
                    ProductId = o.ProductId,
                    BuyerUserId = o.BuyerUserId,
                    SellerUserId = o.SellerUserId,
                    Quantity = o.Quantity,
                    TotalPrice = o.TotalPrice,
                    Status = o.Status,
                    Note = o.Note,
                    PaymentMethod = o.PaymentMethod,
                    PaymentStatus = o.PaymentStatus,
                    PaymentProofUrl = o.PaymentProofUrl,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    RecipeName = r.RecipeName,
                    ImageUrl = r.ImageUrl,
                    BuyerName = buyer.FullName,
                    SellerName = seller.FullName
                };
    }

    // GET: api/orders
    // Lay tat ca don hang (danh cho admin)
    [HttpGet]
    public async Task<IActionResult> GetOrders()
        => Ok(await JoinedOrders().OrderByDescending(o => o.CreatedAt).ToListAsync());

    // GET: api/orders/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    // GET: api/orders/buyer/{userId}
    // Danh sach don hang da mua cua 1 user
    [HttpGet("buyer/{userId}")]
    public async Task<IActionResult> GetByBuyer(int userId)
    {
        var orders = await JoinedOrders()
            .Where(o => o.BuyerUserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders);
    }

    // GET: api/orders/seller/{userId}
    // Danh sach don hang can xu ly cua 1 nguoi ban
    [HttpGet("seller/{userId}")]
    public async Task<IActionResult> GetBySeller(int userId)
    {
        var orders = await JoinedOrders()
            .Where(o => o.SellerUserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders);
    }

    // POST: api/orders
    // Tao don hang moi (nguoi mua dat hang)
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] Order order)
    {
        var product = await _context.Products.FindAsync(order.ProductId);
        if (product == null)
        {
            return BadRequest(new { Message = $"Sản phẩm (ProductId = {order.ProductId}) không tồn tại" });
        }
        if (!product.IsAvailable)
        {
            return BadRequest(new { Message = "Sản phẩm hiện đang tạm dừng bán" });
        }

        var buyerExists = await _context.Users.AnyAsync(u => u.UserId == order.BuyerUserId);
        if (!buyerExists)
        {
            return BadRequest(new { Message = $"Người mua (UserId = {order.BuyerUserId}) không tồn tại" });
        }

        var sellerExists = await _context.Users.AnyAsync(u => u.UserId == order.SellerUserId);
        if (!sellerExists)
        {
            return BadRequest(new { Message = $"Người bán (UserId = {order.SellerUserId}) không tồn tại" });
        }

        if (order.Quantity <= 0)
        {
            return BadRequest(new { Message = "Số lượng phải lớn hơn 0" });
        }

        order.Status = "pending";
        order.PaymentStatus = "unpaid";
        if (order.PaymentMethod != "cod") order.PaymentMethod = "transfer";
        order.CreatedAt = DateTime.Now;
        order.UpdatedAt = DateTime.Now;

        _context.Orders.Add(order);

        // Cong don so luong da ban cho san pham
        product.TotalSold += order.Quantity;
        product.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(order);
    }

    // PUT: api/orders/{id}/status
    // Cap nhat trang thai don hang: pending | confirmed | delivering | completed | cancelled
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatusUpdateRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        var validStatuses = new[] { "pending", "confirmed", "delivering", "completed", "cancelled" };
        if (!validStatuses.Contains(request.Status))
        {
            return BadRequest(new { Message = "Trạng thái không hợp lệ" });
        }

        order.Status = request.Status;
        order.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(order);
    }

    // PUT: api/orders/{id}/payment
    // Cap nhat trang thai thanh toan: unpaid | paid | refunded
    [HttpPut("{id}/payment")]
    public async Task<IActionResult> UpdatePayment(int id, [FromBody] PaymentUpdateRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        var validPayments = new[] { "unpaid", "paid", "refunded" };
        if (!validPayments.Contains(request.PaymentStatus))
        {
            return BadRequest(new { Message = "Trạng thái thanh toán không hợp lệ" });
        }

        order.PaymentStatus = request.PaymentStatus;
        order.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(order);
    }

    // PUT: api/orders/{id}/proof
    // Nguoi mua gui bang chung thanh toan (URL anh)
    [HttpPut("{id}/proof")]
    public async Task<IActionResult> UpdateProof(int id, [FromBody] PaymentProofRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.PaymentProofUrl = request.PaymentProofUrl;
        order.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(order);
    }

    // DELETE: api/orders/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
