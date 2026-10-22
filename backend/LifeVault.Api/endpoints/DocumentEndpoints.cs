
using System.IO.Compression;
using System.Security.Claims;
using LifeVault.Api.Data;
using LifeVault.Api.Models;
using LifeVault.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeVault.Api.Endpoints;

public static class DocumentEndpoints
{
    private const long MaxFileSize = 10 * 1024 * 1024;
    private const int MaxTextLength = 500_000;

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

        // 2. Kullaniciya ait belgeleri listeleme
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

        // 3. Belge adi ve iceriginde arama
        documentsApi.MapGet("/search", async Task<IResult> (
            string? q,
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

            if (string.IsNullOrWhiteSpace(q))
            {
                return Results.BadRequest(new
                {
                    message = "Arama kelimesi bos olamaz."
                });
            }

            var searchText = q.Trim();

            if (searchText.Length > 100)
            {
                return Results.BadRequest(new
                {
                    message = "Arama en fazla 100 karakter olabilir."
                });
            }

            // LIKE ozel karakterlerini etkisiz hale getir.
            // %, _ ve \ normal metin olarak aransin.
            var escaped = searchText
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");

            var pattern = $"%{escaped}%";

            // Sadece giris yapan kullanicinin belgelerinde ara.
            var documents = await db.Documents
                .AsNoTracking()
                .Where(d => d.UserId == userId)
                .Where(d =>
                    EF.Functions.ILike(
                        d.FileName, pattern, "\\") ||
                    (
                        d.ExtractedText != null &&
                        EF.Functions.ILike(
                            d.ExtractedText, pattern, "\\")
                    )
                )
                .OrderByDescending(d => d.UploadedAt)
                .Take(50)
                .Select(d => new
                {
                    d.Id,
                    d.FileName,
                    d.ContentType,
                    d.FileSize,
                    d.UploadedAt
                })
                .ToListAsync();

            return Results.Ok(new
            {
                query = searchText,
                count = documents.Count,
                results = documents
            });
        });

        // 4. Belge indirme
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

        // 5. Belgeden metin okuma ve eski belgelerin metnini kaydetme
        documentsApi.MapGet("/{id:int}/text", async Task<IResult> (
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

            // Metin daha once kaydedilmisse veritabanindan oku.
            if (document.ExtractedText is not null)
            {
                return Results.Ok(new
                {
                    documentId = document.Id,
                    fileName = document.FileName,
                    text = document.ExtractedText,
                    characterCount = document.ExtractedText.Length
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

            try
            {
                var extractedText =
                    DocumentTextExtractor.ExtractText(filePath);

                // Veritabanina kaydedilecek metni sinirla.
                if (extractedText.Length > MaxTextLength)
                {
                    extractedText = extractedText[..MaxTextLength];
                }

                // Bos metin de kaydedilsin.
                // Boylece her istekte dosya tekrar okunmaz.
                document.ExtractedText = extractedText;

                await db.SaveChangesAsync();

                return Results.Ok(new
                {
                    documentId = document.Id,
                    fileName = document.FileName,
                    text = extractedText,
                    characterCount = extractedText.Length
                });
            }
            catch (Exception ex) when (
                ex is IOException ||
                ex is InvalidDataException ||
                ex is UnauthorizedAccessException ||
                ex is NotSupportedException)
            {
                return Results.Problem(
                    title: "Belge okunamadi.",
                    detail: "Dosya iceriginden metin cikarilamadi.",
                    statusCode: 422
                );
            }
        });

        // 6. Belge silme
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

    // 7. Belge yukleme ve metnini kaydetme
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
            // Dosyayi sunucuya kaydet.
            await using (var stream = new FileStream(
                filePath,
                FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            // Temel dosya formati kontrolu
            if (!IsValidDocument(filePath, extension))
            {
                File.Delete(filePath);

                return Results.BadRequest(new
                {
                    message = "Gecersiz veya desteklenmeyen dosya."
                });
            }

            // Dosyanin icindeki metni otomatik cikar.
            string? extractedText = null;

            try
            {
                var text =
                    DocumentTextExtractor.ExtractText(filePath);

                if (!string.IsNullOrWhiteSpace(text))
                {
                    extractedText = text.Length > MaxTextLength
                        ? text[..MaxTextLength]
                        : text;
                }
            }
            catch (Exception ex) when (
                ex is IOException ||
                ex is InvalidDataException ||
                ex is UnauthorizedAccessException ||
                ex is NotSupportedException)
            {
                // Metin okunamazsa belge yine arsivlenebilir.
                Console.WriteLine(
                    $"Belge metni cikarilamadi: {ex.Message}"
                );
            }

            // Dosya bilgilerini ve cikarilan metni
            // PostgreSQL veritabanina kaydet.
            var document = new Document
            {
                FileName = originalFileName,
                StoredFileName = storedFileName,
                ContentType = extension == ".pdf"
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow,
                ExtractedText = extractedText,
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

    // 8. Dosya turunu kontrol etme
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
