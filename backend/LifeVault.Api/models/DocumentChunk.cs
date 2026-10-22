
namespace LifeVault.Api.Models;

public class DocumentChunk
{
    public int Id { get; set; }

    // Parcanin ait oldugu belge
    public int DocumentId { get; set; }

    public Document Document { get; set; } = null!;

    // Belgedeki parca sirasi: 0, 1, 2...
    public int ChunkIndex { get; set; }

    // Parcanin metni
    public string Content { get; set; } = string.Empty;
}
