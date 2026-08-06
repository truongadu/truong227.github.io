namespace CookingApp.API.Models;

public class BadWord
{
    public int BadWordId { get; set; }
    public string Word { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
