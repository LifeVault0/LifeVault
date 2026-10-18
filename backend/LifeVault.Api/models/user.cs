
using Microsoft.AspNetCore.Identity;


namespace LifeVault.Api.Models;

public class User : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
