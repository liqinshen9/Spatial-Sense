namespace Backend.Models;

public class ScoreEntry
{
    public int Id { get; set; }

    public string PlayerName { get; set; } = string.Empty;

    public int Score { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}