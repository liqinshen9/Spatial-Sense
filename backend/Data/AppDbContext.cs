using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<ScoreEntry> Scores => Set<ScoreEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(user => user.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .Property(user => user.Name)
            .HasMaxLength(80);

        modelBuilder.Entity<User>()
            .Property(user => user.Email)
            .HasMaxLength(160);

        modelBuilder.Entity<User>()
            .Property(user => user.AvatarUrl)
            .HasMaxLength(300);

        modelBuilder.Entity<ScoreEntry>()
            .HasOne(score => score.User)
            .WithMany(user => user.Scores)
            .HasForeignKey(score => score.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ScoreEntry>()
            .Property(score => score.Difficulty)
            .HasMaxLength(20);
    }
}