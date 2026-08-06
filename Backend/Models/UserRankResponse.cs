namespace CookingApp.API.Models;

public class UserRankResponse
{
    public int UserId { get; set; }
    public string FullName { get; set; } = "";
    public string Rank { get; set; } = "dong";
    public string Label { get; set; } = "Người mới yêu thích";
    public int TotalLikes { get; set; }
    public int CurrentThreshold { get; set; }
    public int? NextThreshold { get; set; }
    public double Progress { get; set; }
    public bool IsMaxRank { get; set; }
}
