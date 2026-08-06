using System.ComponentModel.DataAnnotations.Schema;

namespace CookingApp.API.Models;

public class Order
{
    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int BuyerUserId { get; set; }

    public int SellerUserId { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    // pending | confirmed | delivering | completed | cancelled
    public string Status { get; set; } = "pending";

    public string? Note { get; set; }

    // cod | transfer
    public string PaymentMethod { get; set; } = "transfer";

    // unpaid | paid | refunded
    public string PaymentStatus { get; set; } = "unpaid";

    public string? PaymentProofUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
