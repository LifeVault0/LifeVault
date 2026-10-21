
using System.Text;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using UglyToad.PdfPig;

namespace LifeVault.Api.Services;

public static class DocumentTextExtractor
{
    public static string ExtractText(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException(
                "Belge dosyası bulunamadı.",
                filePath
            );
        }

        var extension = Path.GetExtension(filePath)
            .ToLowerInvariant();

        return extension switch
        {
            ".pdf" => ExtractPdfText(filePath),
            ".docx" => ExtractDocxText(filePath),
            _ => throw new NotSupportedException(
                "Yalnızca PDF ve DOCX dosyaları destekleniyor."
            )
        };
    }

    private static string ExtractPdfText(string filePath)
    {
        var text = new StringBuilder();

        using var document = PdfDocument.Open(filePath);

        foreach (var page in document.GetPages())
        {
            text.AppendLine(page.Text);
            text.AppendLine();
        }

        return text.ToString().Trim();
    }

    private static string ExtractDocxText(string filePath)
    {
        var text = new StringBuilder();

        using var document =
            WordprocessingDocument.Open(filePath, false);

        var body = document.MainDocumentPart?
    .Document?.Body;

        if (body is null)
        {
            return string.Empty;
        }

        foreach (var paragraph in
                 body.Descendants<Paragraph>())
        {
            var paragraphText = string.Concat(
                paragraph.Descendants<Text>()
                    .Select(t => t.Text)
            );

            if (!string.IsNullOrWhiteSpace(paragraphText))
            {
                text.AppendLine(paragraphText);
            }
        }

        return text.ToString().Trim();
    }
}
