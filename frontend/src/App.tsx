import Reminders from './Reminders'
import { useEffect, useState } from 'react'
import './App.css'
import Documents from './Documents'
import Auth from './Auth'
import AIAssistant from './AIAssistant'
// C# Backend adresimiz
const API_URL = 'http://localhost:5127/api/notes'

// Not veri yapısı
interface Note {
  id: number
  title: string
  content: string
  createdAt?: string
}

function App() {

  // KULLANICI KİMLİK DOĞRULAMA
  const [accessToken, setAccessToken] =
    useState<string | null>(null)

  const [sessionExpired, setSessionExpired] =
    useState(false)

  // Veritabanından gelen notlar
  const [notes, setNotes] = useState<Note[]>([])

  // Not oluşturma formu
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  // Arama
  const [search, setSearch] = useState('')

  // Aktif sayfa
  const [activePage, setActivePage] =
    
useState<'notes' | 'documents' | 'reminders' | 'ai'>('notes')


  // Düzenlenen not
  const [editingId, setEditingId] =
    useState<number | null>(null)

  // Yüklenme ve hata durumları
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  const [error, setError] = useState('')

  // GİRİŞ BAŞARILI OLUNCA
  function handleLogin(token: string) {
    setNotes([])
    setError('')
    setLoading(true)
    setSessionExpired(false)
    setAccessToken(token)
    setActivePage('notes')
    clearForm()
  }

  // ÇIKIŞ YAPMA
  function handleLogout() {
    setAccessToken(null)
    setNotes([])
    setSearch('')
    setError('')
    setLoading(false)
    setActivePage('notes')
    setSessionExpired(false)
    clearForm()
  }

  // TOKEN GEÇERSİZ OLDUĞUNDA
  function handleUnauthorized() {
    handleLogout()
    setSessionExpired(true)
  }

  // FORMU TEMİZLE
  function clearForm() {
    setNewTitle('')
    setNewContent('')
    setEditingId(null)
  }

  // GİRİŞTEN SONRA NOTLARI BACKEND'DEN GETİR
  useEffect(() => {

    if (!accessToken) {
      return
    }

    const controller = new AbortController()

    async function loadNotes() {

      try {
        setLoading(true)
        setError('')

        const response = await fetch(API_URL, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        // Token süresi dolmuş veya geçersiz
        if (response.status === 401) {
          if (!controller.signal.aborted) {
            setAccessToken(null)
            setNotes([])
            setSessionExpired(true)
          }
          return
        }

        if (!response.ok) {
          throw new Error('Notlar getirilemedi.')
        }

        const data: Note[] = await response.json()

        if (!controller.signal.aborted) {
          setNotes(data)
        }

      } catch {

        if (!controller.signal.aborted) {
          setError(
            'Notlar yüklenemedi. Backend bağlantısını kontrol et.'
          )
        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false)
        }

      }
    }

    loadNotes()

    return () => controller.abort()

  }, [accessToken])

  // NOT EKLEME VE GÜNCELLEME
  async function saveNote() {

    if (!accessToken || saving) {
      return
    }

    const title = newTitle.trim()
    const content = newContent.trim()

    if (title === '') {
      alert('Lütfen bir not başlığı yazın!')
      return
    }

    if (content === '') {
      alert('Lütfen not içeriğini yazın!')
      return
    }

    const isEditing = editingId !== null

    const url = isEditing
      ? `${API_URL}/${editingId}`
      : API_URL

    try {
      setSaving(true)
      setError('')

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title,
          content
        })
      })

      // Oturum geçersizse giriş sayfasına dön
      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Not kaydedilemedi.')
      }

      const savedNote: Note = await response.json()

      if (isEditing) {

        // Mevcut notu güncelle
        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note.id === savedNote.id
              ? savedNote
              : note
          )
        )

      } else {

        // Yeni notu ekle
        setNotes((previousNotes) => [
          savedNote,
          ...previousNotes
        ])

      }

      clearForm()

    } catch {
      setError(
        'Not kaydedilemedi. Backend bağlantısını kontrol et.'
      )

    } finally {
      setSaving(false)
    }
  }

  // NOT DÜZENLEME
  function prepareEdit(note: Note) {
    setEditingId(note.id)
    setNewTitle(note.title)
    setNewContent(note.content)
    setActivePage('notes')
  }

  // NOT SİLME
  async function deleteNote(id: number) {

    if (!accessToken || deletingId !== null) {
      return
    }

    try {
      setDeletingId(id)
      setError('')

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      // Token geçersizse çıkış yap
      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Not silinemedi.')
      }

      setNotes((previousNotes) =>
        previousNotes.filter((note) => note.id !== id)
      )

      if (editingId === id) {
        clearForm()
      }

    } catch {
      setError(
        'Not silinemedi. Backend bağlantısını kontrol et.'
      )

    } finally {
      setDeletingId(null)
    }
  }

  // NOT ARAMA
  const filteredNotes = notes.filter((note) => {

    const searchText = search
      .trim()
      .toLocaleLowerCase('tr-TR')

    return (
      note.title
        .toLocaleLowerCase('tr-TR')
        .includes(searchText) ||

      note.content
        .toLocaleLowerCase('tr-TR')
        .includes(searchText)
    )
  })

  // GİRİŞ YAPILMADIYSA AUTH SAYFASINI GÖSTER
  if (!accessToken) {
    return (
      <>
        {sessionExpired && (
          <p
            role="alert"
            style={{
              position: 'fixed',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              padding: '12px 18px',
              backgroundColor: '#fff1f2',
              color: '#be123c',
              borderRadius: 10,
              textAlign: 'center'
            }}
          >
            Oturumun sona erdi. Lütfen tekrar giriş yap.
          </p>
        )}

        <Auth onLogin={handleLogin} />
      </>
    )
  }

  // LIFEVAULT ANA UYGULAMA
  return (
    <div className="app-layout">

      {/* SOL MENÜ */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          🔐 LifeVault
        </div>

        <nav aria-label="Ana menü">

          <button
            type="button"
            className={
              activePage === 'notes' ? 'active' : ''
            }
            onClick={() => setActivePage('notes')}
            aria-current={
              activePage === 'notes' ? 'page' : undefined
            }
          >
            📝 Notlar
          </button>

          <button
            type="button"
            className={
              activePage === 'documents' ? 'active' : ''
            }
            onClick={() => setActivePage('documents')}
            aria-current={
              activePage === 'documents' ? 'page' : undefined
            }
          >
            📁 Belgeler
          </button>

          
<button
  type="button"
  className={
    activePage === 'reminders' ? 'active' : ''
  }
  onClick={() => setActivePage('reminders')}
  aria-current={
    activePage === 'reminders' ? 'page' : undefined
  }
>
  🔔 Hatırlatıcılar
</button>


<button
  type="button"
  className={activePage === 'ai' ? 'active' : ''}
  onClick={() => setActivePage('ai')}
  aria-current={
    activePage === 'ai' ? 'page' : undefined
  }
>
  ✨ AI Asistan
</button>


          {/* ÇIKIŞ BUTONU */}
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Çıkış Yap
          </button>

        </nav>

        <div className="sidebar-footer">
          LifeVault v0.1
        </div>

      </aside>

      {/* ANA İÇERİK */}
      <main>

  
{activePage === 'documents' ? (

  <Documents
    accessToken={accessToken}
    onUnauthorized={handleUnauthorized}
  />


) : activePage === 'reminders' ? (

  <Reminders />

) : activePage === 'ai' ? (

  <AIAssistant />

) : (

  <>

            {/* SAYFA BAŞLIĞI */}
            <header className="page-header">

              <h1>LifeVault</h1>

              <p>
                Kişisel dijital çalışma alanım
              </p>

            </header>

            {/* TOPLAM NOT SAYISI */}
            <div className="stats-card">

              <h3>Toplam Not</h3>

              <p>
                {notes.length}
              </p>

              <span>
                Veritabanındaki toplam notlar
              </span>

            </div>

            <section id="notes">

              <h2>Notlarım</h2>

              {/* NOT ARAMA */}
              <div className="search-box">

                <label htmlFor="noteSearch">
                  🔍 Not Ara
                </label>

                <input
                  id="noteSearch"
                  type="search"
                  placeholder="Notlarında ara..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                <p className="search-count">
                  {filteredNotes.length} not bulundu
                </p>

              </div>

              {/* HATA MESAJI */}
              {error && (
                <p
                  role="alert"
                  style={{ color: '#be123c' }}
                >
                  {error}
                </p>
              )}

              {/* NOT FORMU */}
              <div className="note-form">

                <h3>
                  {editingId !== null
                    ? 'Not Düzenle'
                    : 'Yeni Not Oluştur'}
                </h3>

                <label htmlFor="noteTitle">
                  Not Başlığı:
                </label>

                <input
                  id="noteTitle"
                  type="text"
                  placeholder="Not başlığını yaz..."
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitle(event.target.value)
                  }
                />

                <label htmlFor="noteContent">
                  Not İçeriği:
                </label>

                <textarea
                  id="noteContent"
                  rows={5}
                  placeholder="Notunu buraya yaz..."
                  value={newContent}
                  onChange={(event) =>
                    setNewContent(event.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={saveNote}
                  disabled={saving}
                >
                  {saving
                    ? 'Kaydediliyor...'
                    : editingId !== null
                      ? 'Değişiklikleri Kaydet'
                      : '+ Yeni Not Ekle'}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={clearForm}
                  >
                    Vazgeç
                  </button>
                )}

              </div>

              {/* NOTLARIN LİSTESİ */}
              <div className="notes-list">

                {loading ? (

                  <p>
                    Notlar yükleniyor...
                  </p>

                ) : filteredNotes.length === 0 ? (

                  <div className="empty-state">

                    <h3>Not bulunamadı</h3>

                    <p>
                      {notes.length === 0
                        ? 'Henüz bir not oluşturmadın.'
                        : 'Aramanla eşleşen not bulunamadı.'}
                    </p>

                  </div>

                ) : (

                  filteredNotes.map((note) => (

                    <article
                      className="note-card"
                      key={note.id}
                    >

                      <h3>
                        {note.title}
                      </h3>

                      <p>
                        {note.content}
                      </p>

                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => prepareEdit(note)}
                      >
                        ✏️ Düzenle
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === note.id}
                        onClick={() => deleteNote(note.id)}
                      >
                        {deletingId === note.id
                          ? 'Siliniyor...'
                          : 'Sil'}
                      </button>

                    </article>

                  ))

                )}

              </div>

            </section>

          </>

        )}

      </main>

    </div>
  )
}

export default App
