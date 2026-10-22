
using LifeVault.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LifeVault.Api.Data;

public class LifeVaultDbContext : IdentityDbContext<User>
{
    public LifeVaultDbContext(
        DbContextOptions<LifeVaultDbContext> options
    ) : base(options)
    {
    }

    public DbSet<Note> Notes => Set<Note>();

    public DbSet<Document> Documents => Set<Document>();

    public DbSet<Reminder> Reminders => Set<Reminder>();
}
