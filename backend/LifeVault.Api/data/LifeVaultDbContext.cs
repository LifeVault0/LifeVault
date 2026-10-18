using LifeVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeVault.Api.Data;

public class LifeVaultDbContext : DbContext
{
    public LifeVaultDbContext(
        DbContextOptions<LifeVaultDbContext> options)
        : base(options)
    {
    }

    public DbSet<Note> Notes => Set<Note>();
}