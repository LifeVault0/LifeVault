
namespace LifeVault.Api.Dtos;

public record NoteResponse(
    int Id,
    string Title,
    string Content,
    DateTime CreatedAt
);
