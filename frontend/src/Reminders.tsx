
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
  // Hatırlatıcı arama
const [search, setSearch] = useState('')
// Hatırlatıcı filtreleme seçeneği
const [filter, setFilter] = useState<
  'all' | 'soon' | 'overdue' | 'completed'
>('all')
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

  // HATIRLATICI DURUMUNU HESAPLA
  function getReminderStatus(reminder: Reminder): string {

    if (reminder.completed) {
      return '✅ Tamamlandı'
    }

    const reminderTime = new Date(reminder.dateTime).getTime()
    const remainingTime = reminderTime - Date.now()

    // Tarih geçtiyse
    if (remainingTime < 0) {
      return '🔴 Gecikti'
    }

    // Son 24 saat kaldıysa
    if (remainingTime <= 24 * 60 * 60 * 1000) {
      return '🟠 Yaklaşıyor'
    }

    return '🔵 Bekliyor'
  }

  // Tarihe göre sıralama
  const sortedReminders = [...reminders].sort(
    (a, b) =>
      new Date(a.dateTime).getTime() -
      new Date(b.dateTime).getTime()
  )

  // HATIRLATICI İSTATİSTİKLERİ
  const now = Date.now()

  const totalReminders = reminders.length

  const completedReminders = reminders.filter(
    reminder => reminder.completed
  ).length

  const upcomingReminders = reminders.filter(
    reminder => {
      const time = new Date(reminder.dateTime).getTime()

      return (
        !reminder.completed &&
        time >= now &&
        time - now <= 24 * 60 * 60 * 1000
      )
    }
  ).length

  const overdueReminders = reminders.filter(
    reminder =>
      !reminder.completed &&
      new Date(reminder.dateTime).getTime() < now
  ).length

  // HATIRLATICILARI SEÇİLEN FİLTREYE GÖRE GÖSTER
  const searchText = search.trim().toLocaleLowerCase('tr-TR')
  const filteredReminders = sortedReminders.filter(reminder => {

if (
  !reminder.title
    .toLocaleLowerCase('tr-TR')
    .includes(searchText)
) {
  return false
}

    if (filter === 'all') {
      return true
    }

    if (filter === 'completed') {
      return reminder.completed
    }

    if (reminder.completed) {
      return false
    }

    const reminderTime = new Date(reminder.dateTime).getTime()

    if (filter === 'overdue') {
      return reminderTime < now
    }

    if (filter === 'soon') {
      return reminderTime >= now &&
        reminderTime - now <= 24 * 60 * 60 * 1000
    }

    return true
  })

  return (
    <section className="documents-page reminders-page">

      <h2>🔔 Hatırlatıcılarım</h2>

      <p>
        Yapman gereken işleri planla ve
        önemli tarihleri takip et.
      </p>

{/* HATIRLATICI İSTATİSTİKLERİ */}
<div className="reminder-stats">

  <div className="reminder-stat-card">
    <span>📋 Toplam Hatırlatıcı</span>
    <h3>{totalReminders}</h3>
  </div>

  <div className="reminder-stat-card">
    <span>⏰ Yaklaşıyor</span>
    <h3>{upcomingReminders}</h3>
  </div>

  <div className="reminder-stat-card">
    <span>🔴 Geciken</span>
    <h3>{overdueReminders}</h3>
  </div>

  <div className="reminder-stat-card">
    <span>✅ Tamamlanan</span>
    <h3>{completedReminders}</h3>
  </div>

</div>

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

{/* HATIRLATICI ARAMA */}
<div className="reminder-search">
  <label htmlFor="reminderSearch">
    🔍 Hatırlatıcı Ara
  </label>

  <input
    id="reminderSearch"
    type="search"
    placeholder="Hatırlatıcılarında ara..."
    value={search}
    onChange={event => setSearch(event.target.value)}
  />
</div>

{/* HATIRLATICI FİLTRELERİ */}
<div className="reminder-filters">

  <button
    type="button"
    className={filter === 'all' ? 'active' : ''}
    onClick={() => setFilter('all')}
  >
    📋 Tümü
  </button>

  <button
    type="button"
    className={filter === 'soon' ? 'active' : ''}
    onClick={() => setFilter('soon')}
  >
    ⏰ Yaklaşanlar
  </button>

  <button
    type="button"
    className={filter === 'overdue' ? 'active' : ''}
    onClick={() => setFilter('overdue')}
  >
    🔴 Gecikenler
  </button>

  <button
    type="button"
    className={filter === 'completed' ? 'active' : ''}
    onClick={() => setFilter('completed')}
  >
    ✅ Tamamlananlar
  </button>

</div>

        {filteredReminders.length === 0 ? (

          <p>Henüz hatırlatıcı eklenmedi.</p>

        ) : (

          filteredReminders.map(reminder => (

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

             


<p
  className={`reminder-status ${
    reminder.completed
      ? 'completed'
      : new Date(reminder.dateTime).getTime() < Date.now()
        ? 'overdue'
        : new Date(reminder.dateTime).getTime() - Date.now() <= 86400000
          ? 'soon'
          : 'waiting'
  }`}
>
  Durum: {getReminderStatus(reminder)}
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
