
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent
} from 'react'

// C# Backend belge API adresi
const API_URL = 'http://localhost:5127/api/documents'

// Maksimum dosya boyutu: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Backend'den gelen belge bilgileri
interface StoredDocument {
  id: number
  fileName: string
  contentType: string
  fileSize: number
  uploadedAt: string
}

// App.tsx'ten alınacak bilgiler
interface DocumentsProps {
  accessToken: string
  onUnauthorized: () => void
}

function Documents({
  accessToken,
  onUnauthorized
}: DocumentsProps) {

  // Seçilen dosya
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  // Veritabanından gelen belgeler
  const [documents, setDocuments] =
    useState<StoredDocument[]>([])

  // İşlem durumları
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  // Mesajlar
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 1. BELGELERİ BACKEND'DEN GETİR
  const loadDocuments = useCallback(
    async (signal?: AbortSignal): Promise<boolean> => {

      const response = await fetch(API_URL, {
        signal,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      // Token geçersizse giriş ekranına dön
      if (response.status === 401) {
        onUnauthorized()
        return false
      }

      if (!response.ok) {
        throw new Error(
          `Belgeler getirilemedi. HTTP ${response.status}`
        )
      }

      const data: StoredDocument[] = await response.json()

      if (!signal?.aborted) {
        setDocuments(data)
      }

      return true
    },
    [accessToken, onUnauthorized]
  )

  // SAYFA AÇILDIĞINDA BELGELERİ YÜKLE
  useEffect(() => {

    const controller = new AbortController()

    async function initializeDocuments() {

      setLoading(true)
      setError('')

      try {
        await loadDocuments(controller.signal)

      } catch (err) {

        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Belgeler yüklenemedi.'
          )
        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false)
        }

      }
    }

    void initializeDocuments()

    return () => controller.abort()

  }, [loadDocuments])

  // 2. DOSYA SEÇME
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {

    const file = event.target.files?.[0] ?? null

    // Aynı dosya yeniden seçilebilsin
    event.target.value = ''

    setError('')
    setSuccess('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    // Sadece PDF ve DOCX
    const fileName = file.name.toLowerCase()

    const isAllowed =
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.docx')

    if (!isAllowed) {
      setError(
        'Yalnızca PDF ve DOCX dosyaları yükleyebilirsin.'
      )
      setSelectedFile(null)
      return
    }

    // 10 MB kontrolü
    if (file.size > MAX_FILE_SIZE) {
      setError(
        'Dosya boyutu en fazla 10 MB olabilir.'
      )
      setSelectedFile(null)
      return
    }

    if (file.size === 0) {
      setError('Boş dosya yüklenemez.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  // 3. BELGEYİ BACKEND'E YÜKLE
  async function handleAddDocument() {

    if (!selectedFile || uploading) {
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {

      // Dosyayı multipart/form-data olarak hazırla
      const formData = new FormData()

      formData.append('file', selectedFile)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      })

      // Oturum süresi dolmuşsa
      if (response.status === 401) {
        onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(
          `Belge yüklenemedi. HTTP ${response.status}`
        )
      }

      // Belgeleri yeniden backend'den getir
      const loaded = await loadDocuments()

      if (!loaded) {
        return
      }

      setSelectedFile(null)

      setSuccess(
        'Belgen başarıyla sunucuya yüklendi!'
      )

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Belge yüklenirken hata oluştu.'
      )

    } finally {
      setUploading(false)
    }
  }

  // 4. BELGE İNDİRME
  async function handleDownloadDocument(
    file: StoredDocument
  ) {

    if (downloadingId !== null) {
      return
    }

    setDownloadingId(file.id)
    setError('')

    try {

      const response = await fetch(
        `${API_URL}/${file.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(
          `Belge indirilemedi. HTTP ${response.status}`
        )
      }

      // Backend'den dosyanın içeriğini al
      const blob = await response.blob()

      // Dosya için geçici adres oluştur
      const url = URL.createObjectURL(blob)

      // İndirme bağlantısı oluştur
      const link = document.createElement('a')

      link.href = url
      link.download = file.fileName

      document.body.appendChild(link)

      // İndirmeyi başlat
      link.click()

      // Bağlantıyı temizle
      link.remove()

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 10000)

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Belge indirilirken hata oluştu.'
      )

    } finally {
      setDownloadingId(null)
    }
  }

  // 5. BELGEYİ BACKEND'DEN SİL
  async function handleDeleteDocument(id: number) {

    if (deletingId !== null) {
      return
    }

    const confirmed = window.confirm(
      'Bu belgeyi kalıcı olarak silmek istiyor musun?'
    )

    if (!confirmed) {
      return
    }

    setDeletingId(id)
    setError('')
    setSuccess('')

    try {

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (response.status === 401) {
        onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(
          `Belge silinemedi. HTTP ${response.status}`
        )
      }

      // Silinen belgeyi listeden kaldır
      setDocuments(previous =>
        previous.filter(file => file.id !== id)
      )

      setSuccess('Belge başarıyla silindi.')

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Belge silinirken hata oluştu.'
      )

    } finally {
      setDeletingId(null)
    }
  }

  // BELGELER SAYFASI
  return (
    <section className="documents-page">

      <h2>📁 Belgelerim</h2>

      <p>
        PDF ve Word belgelerini burada
        saklayabilir ve yönetebilirsin.
      </p>

      {/* HATA VE BAŞARI MESAJLARI */}
      {error && (
        <p
          role="alert"
          style={{ color: '#be123c' }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          style={{ color: '#15803d' }}
        >
          {success}
        </p>
      )}

      {/* DOSYA SEÇME ALANI */}
      <div className="document-upload">

        <h3>Yeni Belge Seç</h3>

        <label htmlFor="documentFile">
          Bilgisayarından bir dosya seç:
        </label>

        <input
          id="documentFile"
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <p>
          Desteklenen formatlar: PDF, DOCX
        </p>

        <p>
          Maksimum dosya boyutu: 10 MB
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
            disabled={uploading}
          >
            {uploading
              ? '⏳ Yükleniyor...'
              : '📁 Belgeyi Arşive Ekle'}
          </button>

        </div>

      )}

      {/* BELGE ARŞİVİ */}
      <div className="documents-archive">

        <h3>📁 Belge Arşivim</h3>

        {loading ? (

          <p>Belgeler yükleniyor...</p>

        ) : documents.length === 0 ? (

          <p>Henüz belge eklenmedi.</p>

        ) : (

          documents.map(file => (

            <div
              key={file.id}
              className="document-item"
            >

              <p>📄 {file.fileName}</p>

              <p>
                Boyut:{' '}
                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>

              <p>
                Yüklenme tarihi:{' '}
                {new Date(file.uploadedAt)
                  .toLocaleString('tr-TR')}
              </p>

              {/* İNDİR BUTONU */}
              <button
                type="button"
                onClick={() =>
                  handleDownloadDocument(file)
                }
                disabled={downloadingId !== null}
              >
                {downloadingId === file.id
                  ? '⏳ İndiriliyor...'
                  : '📥 İndir'}
              </button>

              {/* SİL BUTONU */}
              <button
                type="button"
                onClick={() =>
                  handleDeleteDocument(file.id)
                }
                disabled={deletingId !== null}
              >
                {deletingId === file.id
                  ? '⏳ Siliniyor...'
                  : '🗑️ Sil'}
              </button>

            </div>

          ))

        )}

      </div>

    </section>
  )
}

export default Documents
