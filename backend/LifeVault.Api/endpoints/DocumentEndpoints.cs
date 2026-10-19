
using System.IO.Compression;
using System.Security.Claims;
using LifeVault.Api.Data;
using LifeVault.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeVault.Api.Endpoints;

public static class DocumentEndpoints
{
    private const long MaxFileSize = 10 * 1024 * 1024;

    private static string GetStorageFolder()
    {
        return Path.Combine(
            Environment.GetFolderPath(
                Environment.SpecialFolder.LocalApplicationData
            ),
            "LifeVault",
            "documents"
        );
    }

    public static void MapDocumentEndpoints(this WebApplication app)
    {
        var documentsApi = app.MapGroup("/api/documents")
            .RequireAuthorization(policy =>
            {
                policy.AddAuthenticationSchemes(
                    IdentityConstants.BearerScheme
                );

                policy.RequireAuthenticatedUser();
            });

        // 1. Belge yukleme
        documentsApi.MapPost("", UploadDocument)
            .DisableAntiforgery();

        // 2. Belge listeleme
        documentsApi.MapGet("", async Task<IResult> (
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var documents = await db.Documents
                .AsNoTracking()
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new
                {
                    d.Id,
                    d.FileName,
                    d.ContentType,
                    d.FileSize,
                    d.UploadedAt
                })
                .ToListAsync();

            return Results.Ok(documents);
        });

        // 3. Belge indirme
        documentsApi.MapGet("/{id:int}/download", async Task<IResult> (
            int id,
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var document = await db.Documents
                .AsNoTracking()
                .FirstOrDefaultAsync(d =>
                    d.Id == id && d.UserId == userId);

            if (document is null)
            {
                return Results.NotFound(new
                {
                    message = "Belge bulunamadi."
                });
            }

            var filePath = Path.Combine(
                GetStorageFolder(),
                document.StoredFileName
            );

            if (!File.Exists(filePath))
            {
                return Results.NotFound(new
                {
                    message = "Belge dosyasi bulunamadi."
                });
            }

            return Results.File(
                filePath,
                document.ContentType,
                fileDownloadName: document.FileName
            );
        });

        // 4. Belge silme
        documentsApi.MapDelete("/{id:int}", async Task<IResult> (
            int id,
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var document = await db.Documents
                .FirstOrDefaultAsync(d =>
                    d.Id == id && d.UserId == userId);

            if (document is null)
            {
                return Results.NotFound(new
                {
                    message = "Belge bulunamadi."
                });
            }

            var filePath = Path.Combine(
                GetStorageFolder(),
                document.StoredFileName
            );

            db.Documents.Remove(document);
            await db.SaveChangesAsync();

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            return Results.NoContent();
        });
    }

    private static async Task<IResult> UploadDocument(
        IFormFile file,
        ClaimsPrincipal user,
        LifeVaultDbContext db)
    {
        var userId = user.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (string.IsNullOrEmpty(userId))
        {
            return Results.Unauthorized();
        }

        if (file.Length == 0)
        {
            return Results.BadRequest(new
            {
                message = "Bos dosya yuklenemez."
            });
        }

        if (file.Length > MaxFileSize)
        {
            return Results.BadRequest(new
            {
                message = "Dosya en fazla 10 MB olabilir."
            });
        }

        var originalFileName = Path.GetFileName(
            file.FileName.Replace('\\', '/')
        );

        var extension = Path.GetExtension(originalFileName)
            .ToLowerInvariant();

        if (extension != ".pdf" && extension != ".docx")
        {
            return Results.BadRequest(new
            {
                message = "Yalnizca PDF ve DOCX yuklenebilir."
            });
        }

        var storageFolder = GetStorageFolder();

        Directory.CreateDirectory(storageFolder);

        var storedFileName =
            Guid.NewGuid().ToString("N") + extension;

        var filePath = Path.Combine(
            storageFolder,
            storedFileName
        );

        try
        {
            await using (var stream = new FileStream(
                filePath,
                FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            if (!IsValidDocument(filePath, extension))
            {
                File.Delete(filePath);

                return Results.BadRequest(new
                {
                    message = "Gecersiz veya desteklenmeyen dosya."
                });
            }

            var document = new Document
            {
                FileName = originalFileName,
                StoredFileName = storedFileName,
                ContentType = extension == ".pdf"
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow,
                UserId = userId
            };

            db.Documents.Add(document);

            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/documents/{document.Id}",
                new
                {
                    document.Id,
                    document.FileName,
                    document.ContentType,
                    document.FileSize,
                    document.UploadedAt
                }
            );
        }
        catch
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            throw;
        }
    }

    private static bool IsValidDocument(
        string filePath,
        string extension)
    {
        try
        {
            using var stream = File.OpenRead(filePath);

            if (extension == ".pdf")
            {
                byte[] header = new byte[5];

                if (stream.Read(header, 0, 5) != 5)
                {
                    return false;
                }

                return System.Text.Encoding.ASCII
                    .GetString(header) == "%PDF-";
            }

            if (extension == ".docx")
            {
                using var archive = new ZipArchive(
                    stream,
                    ZipArchiveMode.Read
                );

                return archive.GetEntry("[Content_Types].xml")
                           is not null
                    && archive.GetEntry("word/document.xml")
                           is not null;
            }

            return false;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }
}
