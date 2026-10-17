
import { useState } from 'react'

function Documents() {

  // Kullanıcının seçtiği dosyayı tutar
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  // Dosya seçildiğinde çalışır
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null

    setSelectedFile(file)
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
            <strong>Dosya adı:</strong>{" "}
            {selectedFile.name}
          </p>

          <p>
            <strong>Boyut:</strong>{" "}
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>

          <p className="upload-warning">
            Dosya henüz sunucuya yüklenmedi.
          </p>

        </div>

      )}

      {/* BELGE ARŞİVİ */}
      <div className="empty-state">

        <h3>Henüz belge yüklenmedi</h3>

        <p>
          Kaydettiğin belgeler ileride burada
          listelenecek.
        </p>

      </div>

    </section>
  )
}

export default Documents
