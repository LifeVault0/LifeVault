
namespace LifeVault.Api.Models;

public class Document
{
    public int Id { get; set; }

    // Kullanicinin gordugu orijinal dosya adi.
    public string FileName { get; set; } = string.Empty;

    // Sunucuda dosyayi sakladigimiz benzersiz ad.
    public string StoredFileName { get; set; } = string.Empty;

    // Dosyanin turu.
    public string ContentType { get; set; } = string.Empty;

    // Dosyanin byte cinsinden boyutu.
    public long FileSize { get; set; }

    // Dosyanin yuklendigi tarih.
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Dosyanin sahibi.
    public string UserId { get; set; } = string.Empty;

    public User User { get; set; } = null!;
}
