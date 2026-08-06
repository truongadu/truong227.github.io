using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CookingApp.API.Models;

public class BankAccount
{
    [Key]
    public int BankAccountId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }

    public string BankName { get; set; } = "";

    public string AccountNumber { get; set; } = "";

    public string AccountHolder { get; set; } = "";

    public string? Branch { get; set; }

    public bool IsDefault { get; set; } = false;

    public string? QrCodeUrl { get; set; }

    public virtual User? User { get; set; }
}
