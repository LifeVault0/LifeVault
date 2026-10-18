
using LifeVault.Api.Data;
using LifeVault.Api.Dtos;
using LifeVault.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI desteği
builder.Services.AddOpenApi();

// Frontend ile backend arasındaki isteklere izin ver.
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

// PostgreSQL bağlantısını yapılandır.
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Veritabani baglanti ayari bulunamadi."
    );

builder.Services.AddDbContext<LifeVaultDbContext>(options =>
    options.UseNpgsql(connectionString)
);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// CORS politikasını etkinleştir.
app.UseCors("FrontendPolicy");

// API'nin çalıştığını kontrol et.
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        message = "LifeVault API calisiyor!"
    });
});

// 1. Bütün notları listele.
app.MapGet("/api/notes", async (LifeVaultDbContext db) =>
{
    var notes = await db.Notes
        .AsNoTracking()
        .OrderByDescending(note => note.CreatedAt)
        .ToListAsync();

    return Results.Ok(notes);
});

// 2. ID üzerinden tek bir not getir.
app.MapGet(
    "/api/notes/{id:int}",
    async Task<IResult> (int id, LifeVaultDbContext db) =>
    {
        var note = await db.Notes
            .AsNoTracking()
            .FirstOrDefaultAsync(note => note.Id == id);

        if (note is null)
        {
            return Results.NotFound(new
            {
                message = "Not bulunamadi."
            });
        }

        return Results.Ok(note);
    }
);

// 3. Yeni bir not oluştur.
app.MapPost(
    "/api/notes",
    async Task<IResult> (
        CreateNoteRequest request,
        LifeVaultDbContext db
    ) =>
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

        var note = new Note
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.Notes.Add(note);

        await db.SaveChangesAsync();

        return Results.Created(
            $"/api/notes/{note.Id}",
            note
        );
    }
);

// 4. Var olan bir notu güncelle.
app.MapPut(
    "/api/notes/{id:int}",
    async Task<IResult> (
        int id,
        UpdateNoteRequest request,
        LifeVaultDbContext db
    ) =>
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Results.BadRequest(new
            {
                message = "Not basligi bos olamaz."
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


        var note = await db.Notes.FindAsync(id);

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

        return Results.Ok(note);
    }
);

// 5. Var olan bir notu sil.
app.MapDelete(
    "/api/notes/{id:int}",
    async Task<IResult> (
        int id,
        LifeVaultDbContext db
    ) =>
    {
        var note = await db.Notes.FindAsync(id);

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
    }
);

app.Run();
