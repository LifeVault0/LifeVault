
using System.Security.Claims;
using LifeVault.Api.Data;
using LifeVault.Api.Dtos;
using LifeVault.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// React frontend icin CORS ayarlari.
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// PostgreSQL baglantisi.
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Veritabani baglanti ayari bulunamadi."
    );

builder.Services.AddDbContext<LifeVaultDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// ASP.NET Core Identity.
builder.Services
    .AddIdentityApiEndpoints<User>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<LifeVaultDbContext>();

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

// API kontrol endpoint'i.
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        message = "LifeVault API calisiyor!"
    });
});

// Kullanici kayit ve giris endpoint'leri.
app.MapGroup("/api/auth")
    .MapIdentityApi<User>();

// Tum not endpoint'leri giris gerektirir.
var notesApi = app.MapGroup("/api/notes")
    .RequireAuthorization();

// 1. Giris yapan kullanicinin notlarini listele.
notesApi.MapGet("", async Task<IResult> (
    ClaimsPrincipal user,
    LifeVaultDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    var notes = await db.Notes
        .AsNoTracking()
        .Where(note => note.UserId == userId)
        .OrderByDescending(note => note.CreatedAt)
        .ToListAsync();

    return Results.Ok(notes.Select(ToNoteResponse).ToList());
});

// 2. Kullanicinin tek bir notunu getir.
notesApi.MapGet("/{id:int}", async Task<IResult> (
    int id,
    ClaimsPrincipal user,
    LifeVaultDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    var note = await db.Notes
        .AsNoTracking()
        .FirstOrDefaultAsync(note =>
            note.Id == id && note.UserId == userId);

    if (note is null)
    {
        return Results.NotFound(new
        {
            message = "Not bulunamadi."
        });
    }

    return Results.Ok(ToNoteResponse(note));
});

// 3. Yeni not olustur.
notesApi.MapPost("", async Task<IResult> (
    CreateNoteRequest request,
    ClaimsPrincipal user,
    LifeVaultDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new
        {
            message = "Not basligi bos olamaz."
        });
    }

    if (request.Title.Length > 150)
    {
        return Results.BadRequest(new
        {
            message = "Not basligi en fazla 150 karakter olabilir."
        });
    }

    if (string.IsNullOrWhiteSpace(request.Content))
    {
        return Results.BadRequest(new
        {
            message = "Not icerigi bos olamaz."
        });
    }

    if (request.Content.Length > 10000)
    {
        return Results.BadRequest(new
        {
            message = "Not icerigi en fazla 10000 karakter olabilir."
        });
    }

    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    var note = new Note
    {
        Title = request.Title.Trim(),
        Content = request.Content.Trim(),
        CreatedAt = DateTime.UtcNow,
        UserId = userId
    };

    db.Notes.Add(note);
    await db.SaveChangesAsync();

    return Results.Created(
        $"/api/notes/{note.Id}",
        ToNoteResponse(note)
    );
});

// 4. Kullanicinin notunu guncelle.
notesApi.MapPut("/{id:int}", async Task<IResult> (
    int id,
    UpdateNoteRequest request,
    ClaimsPrincipal user,
    LifeVaultDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new
        {
            message = "Not basligi bos olamaz."
        });
    }

    if (request.Title.Length > 150)
    {
        return Results.BadRequest(new
        {
            message = "Not basligi en fazla 150 karakter olabilir."
        });
    }

    if (string.IsNullOrWhiteSpace(request.Content))
    {
        return Results.BadRequest(new
        {
            message = "Not icerigi bos olamaz."
        });
    }

    if (request.Content.Length > 10000)
    {
        return Results.BadRequest(new
        {
            message = "Not icerigi en fazla 10000 karakter olabilir."
        });
    }

    var note = await db.Notes.FirstOrDefaultAsync(note =>
        note.Id == id && note.UserId == userId);

    if (note is null)
    {
        return Results.NotFound(new
        {
            message = "Not bulunamadi."
        });
    }

    note.Title = request.Title.Trim();
    note.Content = request.Content.Trim();

    await db.SaveChangesAsync();

    return Results.Ok(ToNoteResponse(note));
});

// 5. Kullanicinin notunu sil.
notesApi.MapDelete("/{id:int}", async Task<IResult> (
    int id,
    ClaimsPrincipal user,
    LifeVaultDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    var note = await db.Notes.FirstOrDefaultAsync(note =>
        note.Id == id && note.UserId == userId);

    if (note is null)
    {
        return Results.NotFound(new
        {
            message = "Not bulunamadi."
        });
    }

    db.Notes.Remove(note);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

// Veritabani modelini frontend'e uygun DTO'ya donustur.
static NoteResponse ToNoteResponse(Note note)
{
    return new NoteResponse(
        note.Id,
        note.Title,
        note.Content,
        note.CreatedAt
    );
}

app.Run();
