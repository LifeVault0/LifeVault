
namespace LifeVault.Api.Services;

public static class DocumentChunkingService
{
    public static List<string> SplitText(
        string? text,
        int chunkSize = 1000,
        int overlap = 150)
    {
        var chunks = new List<string>();

        if (string.IsNullOrWhiteSpace(text))
        {
            return chunks;
        }

        if (chunkSize <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(chunkSize));
        }

        if (overlap < 0 || overlap >= chunkSize)
        {
            throw new ArgumentOutOfRangeException(
                nameof(overlap));
        }

        text = text.Trim();

        int start = 0;

        while (start < text.Length)
        {
            int end = Math.Min(
                start + chunkSize,
                text.Length
            );

            // Mumkunse kelimenin ortasindan bolme.
            if (end < text.Length)
            {
                int lastSpace = text.LastIndexOf(
                    ' ',
                    end - 1,
                    end - start
                );

                if (lastSpace > start + chunkSize / 2)
                {
                    end = lastSpace + 1;
                }
            }

            string chunk = text[start..end].Trim();

            if (!string.IsNullOrWhiteSpace(chunk))
            {
                chunks.Add(chunk);
            }

            if (end == text.Length)
            {
                break;
            }

            // Sonraki parca onceki parcayla
            // belirli miktarda ortak metin icerir.
            start = Math.Max(start + 1, end - overlap);
        }

        return chunks;
    }
}
