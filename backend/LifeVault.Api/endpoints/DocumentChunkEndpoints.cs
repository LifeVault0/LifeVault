
using System.Security.Claims;
using LifeVault.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeVault.Api.Endpoints;

public static class DocumentChunkEndpoints
{
    public static void MapDocumentChunkEndpoints(
        this WebApplication app)
    {
        var chunksApi = app.MapGroup(
            "/api/documents/chunks")
            .RequireAuthorization(policy =>
            {
                policy.AddAuthenticationSchemes(
                    IdentityConstants.BearerScheme);

                policy.RequireAuthenticatedUser();
            });

        // Belge parcalarinin icinde arama yap.
        chunksApi.MapGet("/search", async Task<IResult> (
            string? q,
            ClaimsPrincipal user,
            LifeVaultDbContext db) =>
        {
            // Giris yapan kullaniciyi belirle.
            var userId = user.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            // Arama metnini kontrol et.
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
            var escaped = searchText
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");

            var pattern = $"%{escaped}%";

            // Kullaniciya ait belgelerin parcalarinda ara.
            var chunks = await db.DocumentChunks
                .AsNoTracking()
                .Where(c => c.Document.UserId == userId)
                .Where(c =>
                    EF.Functions.ILike(
                        c.Content,
                        pattern,
                        "\\"))
                .OrderBy(c => c.DocumentId)
                .ThenBy(c => c.ChunkIndex)
                .Take(50)
                .Select(c => new
                {
                    c.Id,
                    c.DocumentId,
                    documentName = c.Document.FileName,
                    c.ChunkIndex,
                    c.Content
                })
                .ToListAsync();

            return Results.Ok(new
            {
                query = searchText,
                count = chunks.Count,
                results = chunks
            });
        });
    }
}
