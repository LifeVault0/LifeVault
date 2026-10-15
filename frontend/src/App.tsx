
import { useState } from 'react'
import './App.css'

// Notlarımızın veri yapısı
interface Note {
  id: number
  title: string
  content: string
}

function App() {

  // Başlangıç notlarımız (örnek veriler)
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "İlk notum",
      content: "LifeVault projemi geliştirmeye başladım!"
    },
    {
      id: 2,
      title: "React Öğreniyorum",
      content: "Bugün React ve CSS öğrendim."
    },
    {
      id: 3,
      title: "TypeScript Çalışıyorum",
      content: "TypeScript ile veri tiplerini öğreniyorum."
    }
  ])

  // Not oluşturma alanları
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")

  // Arama kutusuna yazılan metin
  const [search, setSearch] = useState("")

const [editingId, setEditingId] = useState<number | null>(null)

  // YENİ NOT EKLEME
  function addNote() {
    const title = newTitle.trim()
    const content = newContent.trim()

    if (title === "") {
      alert("Lütfen bir not başlığı yazın!")
      return
    }

    if (content === "") {
      alert("Lütfen not içeriğini yazın!")
      return
    }

if (editingId !== null) {
  setNotes((previousNotes) =>
    previousNotes.map((note) =>
      note.id === editingId
        ? { ...note, title: title, content: content }
        : note
    )
  )

  setEditingId(null)
  setNewTitle("")
  setNewContent("")
  return
}

    const newNote: Note = {
      id: Date.now(),
      title: title,
      content: content
    }

    setNotes((previousNotes) => [
      ...previousNotes,
      newNote
    ])

    // Formu temizle
    setNewTitle("")
    setNewContent("")
  }

  // NOT SİLME
  function deleteNote(id: number) {
    setNotes((previousNotes) =>
      previousNotes.filter((note) => note.id !== id)
    )
  }


function prepareEdit(note: Note) {
  setEditingId(note.id)
  setNewTitle(note.title)
  setNewContent(note.content)
}


  // NOT ARAMA
  const filteredNotes = notes.filter((note) => {
    const searchText = search
      .trim()
      .toLocaleLowerCase("tr-TR")

    const title = note.title.toLocaleLowerCase("tr-TR")
    const content = note.content.toLocaleLowerCase("tr-TR")

    return (
      title.includes(searchText) ||
      content.includes(searchText)
    )
  })

  return (
    <div className="app-layout">

      {/* SOL MENÜ */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          🔐 LifeVault
        </div>

        <nav aria-label="Ana menü">

          <a href="#notes" className="active" aria-current="page">
            📝 Notlar
          </a>

          <span>📁 Belgeler (Yakında)</span>
          <span>✅ Görevler (Yakında)</span>
          <span>✨ AI Asistan (Yakında)</span>

        </nav>

        <div className="sidebar-footer">
          LifeVault v0.1
        </div>

      </aside>

      {/* ANA İÇERİK */}
      <main>

        <header className="page-header">
          <h1>LifeVault</h1>
          <p>Kişisel dijital çalışma alanım</p>
        </header>

        {/* TOPLAM NOT SAYISI */}
        <div className="stats-card">
          <h3>Toplam Not</h3>
          <p>{notes.length}</p>
          <span>Çalışma alanındaki notlar</span>
        </div>

        {/* NOT YÖNETİMİ */}
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

            <p className="search-count" role="status">
              {filteredNotes.length} not bulundu
            </p>

          </div>

          {/* NOT OLUŞTURMA FORMU */}
          <div className="note-form">

            <h3>Yeni Not Oluştur</h3>

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
  onClick={addNote}
>
  {editingId !== null
    ? "Değişiklikleri Kaydet"
    : "+ Yeni Not Ekle"}
</button>

{editingId !== null && (
  <button
    type="button"
    className="cancel-button"
    onClick={() => {
      setEditingId(null)
      setNewTitle("")
      setNewContent("")
    }}
  >
    Vazgeç
  </button>
)}


          </div>

          {/* NOTLARIN LİSTESİ */}
          <div className="notes-list">

            {filteredNotes.length === 0 ? (

              <div className="empty-state" role="status">
                <h3>Not bulunamadı</h3>

                <p>
                  {notes.length === 0
                    ? "Henüz bir not oluşturmadın."
                    : "Aradığın kelimeyle eşleşen bir not yok."}
                </p>
              </div>

            ) : (

              filteredNotes.map((note) => (

                <article
                  className="note-card"
                  key={note.id}
                >

                  <h3>{note.title}</h3>

                  <p>{note.content}</p>

<button
  type="button"
  className="edit-button"
  onClick={() => prepareEdit(note)}
>
  ✏️ Düzenle
</button>

                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                  >
                    Sil
                  </button>

                </article>

              ))

            )}

          </div>

        </section>

      </main>

    </div>
  )
}

export default App
