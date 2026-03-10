using LifeEventsHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventInvite> EventInvites => Set<EventInvite>();
    public DbSet<PendingEvent> PendingEvents => Set<PendingEvent>();
    public DbSet<Wish> Wishes => Set<Wish>();
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(u =>
        {
            u.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Event>(e =>
        {
            e.HasIndex(x => x.EventType);
            e.HasIndex(x => x.CreatedAt);
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Wish>(w =>
        {
            w.HasOne(x => x.Event)
             .WithMany(x => x.Wishes)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventInvite>(ei =>
        {
            ei.HasOne(x => x.Event)
             .WithMany(x => x.Invites)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);
            ei.HasIndex(x => new { x.EventId, x.InvitedEmail }).IsUnique();
        });
    }
}
