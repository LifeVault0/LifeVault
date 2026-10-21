
import { useState, type FormEvent } from 'react'

// Hatırlatıcı veri yapısı
interface Reminder {
  id: string
  title: string
  dateTime: string
  completed: boolean
}

function Reminders() {

  // Hatırlatıcı listesi
  const [reminders, setReminders] =
    useState<Reminder[]>([])

  // Form bilgileri
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')

  // Hata mesajı
  const [error, setError] = useState('')

  // 1. HATIRLATICI EKLEME
  function handleAddReminder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Lütfen hatırlatıcı başlığı yaz.')
      return
    }

    if (!dateTime) {
      setError('Lütfen tarih ve saat seç.')
      return
    }

    const selectedTime = new Date(dateTime).getTime()

    if (
      Number.isNaN(selectedTime) ||
      selectedTime <= Date.now()
    ) {
      setError('Lütfen gelecekteki bir tarih ve saat seç.')
      return
    }

    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title: title.trim(),
      dateTime,
      completed: false
    }

    setReminders(previous => [
      ...previous,
      newReminder
    ])

    // Formu temizle
    setTitle('')
    setDateTime('')
  }

  // 2. TAMAMLANDI İŞARETLEME
  function handleToggleReminder(id: string) {
    setReminders(previous =>
      previous.map(reminder =>
        reminder.id === id
          ? {
              ...reminder,
              completed: !reminder.completed
            }
          : reminder
      )
    )
  }

  // 3. HATIRLATICI SİLME
  function handleDeleteReminder(id: string) {
    setReminders(previous =>
      previous.filter(reminder => reminder.id !== id)
    )
  }

  // Tarihe göre sıralama
  const sortedReminders = [...reminders].sort(
    (a, b) =>
      new Date(a.dateTime).getTime() -
      new Date(b.dateTime).getTime()
  )

  return (
    <section className="documents-page reminders-page">

      <h2>🔔 Hatırlatıcılarım</h2>

      <p>
        Yapman gereken işleri planla ve
        önemli tarihleri takip et.
      </p>

      {/* YENİ HATIRLATICI FORMU */}
      <form
        className="document-upload"
        onSubmit={handleAddReminder}
      >

        <h3>➕ Yeni Hatırlatıcı</h3>

        <label htmlFor="reminderTitle">
          Hatırlatıcı Başlığı:
        </label>

        <input
          id="reminderTitle"
          type="text"
          placeholder="Örneğin: Proje ödevini teslim et"
          value={title}
          onChange={event =>
            setTitle(event.target.value)
          }
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px',
            margin: '10px 0 18px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px'
          }}
        />

        <label htmlFor="reminderDateTime">
          Tarih ve Saat:
        </label>

        <input
          id="reminderDateTime"
          type="datetime-local"
          value={dateTime}
          onChange={event =>
            setDateTime(event.target.value)
          }
          style={{
            display: 'block',
            padding: '12px',
            margin: '10px 0 18px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px'
          }}
        />

        {error && (
          <p
            role="alert"
            style={{ color: '#be123c' }}
          >
            {error}
          </p>
        )}

        <button type="submit">
          🔔 Hatırlatıcı Ekle
        </button>

      </form>

      {/* HATIRLATICI LİSTESİ */}
      <div className="documents-archive">

        <h3>📋 Hatırlatıcı Listem</h3>

        {sortedReminders.length === 0 ? (

          <p>Henüz hatırlatıcı eklenmedi.</p>

        ) : (

          sortedReminders.map(reminder => (

            <div
              className="document-item"
              key={reminder.id}
            >

              <h4
                style={{
                  textDecoration: reminder.completed
                    ? 'line-through'
                    : 'none'
                }}
              >
                {reminder.completed ? '✅' : '⏰'}{' '}
                {reminder.title}
              </h4>

              <p>
                📅{' '}
                {new Date(reminder.dateTime)
                  .toLocaleString('tr-TR')}
              </p>

              <p>
                Durum:{' '}
                {reminder.completed
                  ? 'Tamamlandı'
                  : 'Bekliyor'}
              </p>

              <button
                type="button"
                onClick={() =>
                  handleToggleReminder(reminder.id)
                }
              >
                {reminder.completed
                  ? '↩️ Geri Al'
                  : '✅ Tamamlandı'}
              </button>

              {' '}

              <button
                type="button"
                onClick={() =>
                  handleDeleteReminder(reminder.id)
                }
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

export default Reminders
