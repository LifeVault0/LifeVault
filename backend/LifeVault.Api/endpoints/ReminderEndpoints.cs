
using System.Security.Claims;
using LifeVault.Api.Data;
using LifeVault.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeVault.Api.Endpoints;

public static class ReminderEndpoints
{
    public record ReminderRequest(
        string Title,
        DateTimeOffset DateTime,
        bool Completed = false
    );

    public static void MapReminderEndpoints(this WebApplication app)
    {
        var remindersApi = app.MapGroup("/api/reminders")
            .RequireAuthorization(policy =>
            {
                policy.AddAuthenticationSchemes(
                    IdentityConstants.BearerScheme
                );

                policy.RequireAuthenticatedUser();
            });

        // 1. Hatirlaticilari listele
        remindersApi.MapGet("", async (
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            var reminders = await db.Reminders
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.DateTime)
                .Select(r => new
                {
                    r.Id,
                    r.Title,
                    r.DateTime,
                    r.Completed,
                    r.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(reminders);
        });

        // 2. Yeni hatirlatici ekle
        remindersApi.MapPost("", async (
            ReminderRequest request,
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Title) ||
                request.Title.Length > 150)
            {
                return Results.BadRequest(new
                {
                    message = "Baslik 1-150 karakter olmali."
                });
            }

            if (request.DateTime <= DateTimeOffset.UtcNow)
            {
                return Results.BadRequest(new
                {
                    message = "Gelecekteki bir tarih secilmeli."
                });
            }

            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            var reminder = new Reminder
            {
                Title = request.Title.Trim(),
                DateTime = request.DateTime.UtcDateTime,
                Completed = false,
                UserId = userId
            };

            db.Reminders.Add(reminder);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/reminders/{reminder.Id}",
                new
                {
                    reminder.Id,
                    reminder.Title,
                    reminder.DateTime,
                    reminder.Completed,
                    reminder.CreatedAt
                });
        });

        // 3. Hatirlaticiyi guncelle
        remindersApi.MapPut("/{id:int}", async (
            int id,
            ReminderRequest request,
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            var reminder = await db.Reminders
                .FirstOrDefaultAsync(r =>
                    r.Id == id && r.UserId == userId);

            if (reminder is null)
                return Results.NotFound();

            if (string.IsNullOrWhiteSpace(request.Title) ||
                request.Title.Length > 150)
            {
                return Results.BadRequest(new
                {
                    message = "Baslik 1-150 karakter olmali."
                });
            }

            reminder.Title = request.Title.Trim();
            reminder.DateTime = request.DateTime.UtcDateTime;
            reminder.Completed = request.Completed;

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                reminder.Id,
                reminder.Title,
                reminder.DateTime,
                reminder.Completed,
                reminder.CreatedAt
            });
        });

        // 4. Hatirlaticiyi sil
        remindersApi.MapDelete("/{id:int}", async (
            int id,
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            var reminder = await db.Reminders
                .FirstOrDefaultAsync(r =>
                    r.Id == id && r.UserId == userId);

            if (reminder is null)
                return Results.NotFound();

            db.Reminders.Remove(reminder);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
