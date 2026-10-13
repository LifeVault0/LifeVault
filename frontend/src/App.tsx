import { useState } from 'react'
import './App.css'

interface Note {
  id: number
  title: string
  content: string
}

function App() {
  
const [notes, setNotes] = useState<Note[]>([
  {    id: 1,
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


function addNote() {
  const newNote: Note = {
    id: Date.now(),
    title: "Yeni Not",
    content: "Bu not butona basılarak oluşturuldu."
  }

setNotes((previousNotes) => [...previousNotes, newNote])}

  return (
    <main>
      <h1>LifeVault</h1>
      <p>Kişisel dijital çalışma alanım</p>

      <section>
        <h2>Notlarım</h2>
        
<button type="button" onClick={addNote}>
  + Yeni Not Ekle
</button>


        {notes.map((note) => (
          <article className="note-card" key={note.id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
