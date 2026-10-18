
import { useState, type ChangeEvent } from 'react'

function Documents() {

  // Kullanıcının seçtiği dosya
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  // Arşive eklenen belgeler
  const [documents, setDocuments] = useState<File[]>([])

  // 1. DOSYA SEÇME
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null

    setSelectedFile(file)

    // Aynı dosya tekrar seçilebilsin
    event.target.value = ''
  }

  // 2. BELGEYİ ARŞİVE EKLEME
  function handleAddDocument() {
    if (!selectedFile) return

    // Dosya arşivde zaten var mı?
    const alreadyExists = documents.some(
      file =>
        file.name === selectedFile.name &&
        file.size === selectedFile.size &&
        file.lastModified === selectedFile.lastModified
    )

    if (alreadyExists) {
      alert("Bu belge zaten arşivinizde bulunuyor!")
      return
    }

    // Yeni belgeyi listeye ekle
    setDocuments(prev => [...prev, selectedFile])

    // Seçili dosyayı temizle
    setSelectedFile(null)
  }

  // 3. BELGE SİLME
  function handleDeleteDocument(indexToDelete: number) {
    setDocuments(prev =>
      prev.filter((_, index) => index !== indexToDelete)
    )
  }

  // 4. BELGE İNDİRME
  function handleDownloadDocument(file: File) {

    // Dosya için geçici bir adres oluştur
    const url = URL.createObjectURL(file)

    // Geçici bir indirme bağlantısı oluştur
    const link = document.createElement('a')

    link.href = url
    link.download = file.name

    // Bağlantıyı sayfaya ekle
    document.body.appendChild(link)

    // İndirmeyi başlat
    link.click()

    // Bağlantıyı kaldır
    link.remove()

    // Geçici adresi temizle
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 10000)
  }

  return (
    <section className="documents-page">

      <h2>📁 Belgelerim</h2>

      <p>
        PDF ve Word belgelerini burada
        saklayabilir ve yönetebilirsin.
      </p>

      {/* DOSYA SEÇME ALANI */}
      <div className="document-upload">

        <h3>Yeni Belge Seç</h3>

        <label htmlFor="documentFile">
          Bilgisayarından bir dosya seç:
        </label>

        <input
          id="documentFile"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />

        <p>
          Desteklenen formatlar: PDF, DOC, DOCX
        </p>

      </div>

      {/* SEÇİLEN DOSYA */}
      {selectedFile && (

        <div className="selected-file">

          <h3>📄 Seçilen Dosya</h3>

          <p>
            <strong>Dosya adı:</strong>{' '}
            {selectedFile.name}
          </p>

          <p>
            <strong>Boyut:</strong>{' '}
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>

          <p className="upload-warning">
            Dosya henüz sunucuya yüklenmedi.
          </p>

          <button
            type="button"
            onClick={handleAddDocument}
          >
            📁 Belgeyi Arşive Ekle
          </button>

        </div>

      )}

      {/* BELGE ARŞİVİ */}
      <div className="documents-archive">

        <h3>📁 Belge Arşivim</h3>

        {documents.length === 0 ? (

          <p>Henüz belge eklenmedi.</p>

        ) : (

          documents.map((file, index) => (

            <div
              key={index}
              className="document-item"
            >

              <p>📄 {file.name}</p>

              <p>
                Boyut:{' '}
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>

              {/* İNDİR BUTONU */}
              <button
                type="button"
                onClick={() => handleDownloadDocument(file)}
              >
                📥 İndir
              </button>

              {/* SİL BUTONU */}
              <button
                type="button"
                onClick={() => handleDeleteDocument(index)}
              >
                🗑️ Sil
              </button>

            </div>

          ))

        )}

      </div>

    </section>
  )
}

export default Documents
