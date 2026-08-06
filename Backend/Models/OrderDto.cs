namespace CookingApp.API.Models;

// Dung de tra ve don hang kem thong tin join (ten cong thuc, nguoi mua, nguoi ban)
public class OrderDto
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int BuyerUserId { get; set; }
    public int SellerUserId { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = "pending";
    public string? Note { get; set; }
    public string PaymentMethod { get; set; } = "transfer";
    public string PaymentStatus { get; set; } = "unpaid";
    public string? PaymentProofUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string RecipeName { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string BuyerName { get; set; } = "";
    public string SellerName { get; set; } = "";
}

// Dung cho PUT /api/orders/{id}/status
public class OrderStatusUpdateRequest
{
    public string Status { get; set; } = "";
}

// Dung cho PUT /api/orders/{id}/payment
public class PaymentUpdateRequest
{
    public string PaymentStatus { get; set; } = "";
}

// Dung cho PUT /api/orders/{id}/proof
public class PaymentProofRequest
{
    public string PaymentProofUrl { get; set; } = "";
}
