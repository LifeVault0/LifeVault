
namespace LifeVault.Api.Models;

public class Reminder
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTime DateTime { get; set; }

    public bool Completed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string UserId { get; set; } = string.Empty;

    public User User { get; set; } = null!;
}
