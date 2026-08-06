namespace CookingApp.API.Models;

public class Friend
{
    public int FriendId { get; set; }
    public int UserId { get; set; }
    public int FriendUserId { get; set; }
    public string Status { get; set; } = "pending"; // pending | accepted | rejected
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}