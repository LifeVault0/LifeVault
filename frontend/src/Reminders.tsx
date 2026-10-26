
import { useEffect, useState, type FormEvent } from 'react'

// Hatırlatıcı veri yapısı
interface Reminder {
  id: number
  title: string
  dateTime: string
  completed: boolean
}

interface RemindersProps {
  accessToken: string
  onUnauthorized: () => void
}

function Reminders(_props: RemindersProps) {

  // Hatırlatıcı listesi
  const [reminders, setReminders] =
    useState<Reminder[]>([])

  // Form bilgileri
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')

  // Hata mesajı
  const [error, setError] = useState('')
  
  // Hatırlatıcıları backend'den getir
  useEffect(() => {
    const controller = new AbortController()

    async function loadReminders() {
      try {
        const response = await fetch(
          'http://localhost:5127/api/reminders',
          {
            headers: {
              Authorization: `Bearer ${_props.accessToken}`
            },
            signal: controller.signal
          }
        )

        if (controller.signal.aborted) return

        if (response.status === 401) {
          _props.onUnauthorized()
          return
        }

        if (!response.ok) {
          throw new Error('Hatırlatıcılar yüklenemedi.')
        }

        const data: Reminder[] = await response.json()

        if (!controller.signal.aborted) {
          setReminders(data)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Hatırlatıcılar yüklenemedi.')
        }
      }
    }

    void loadReminders()

    return () => controller.abort()
  }, [_props.accessToken, _props.onUnauthorized])

  // Hatırlatıcı arama
const [search, setSearch] = useState('')
// Hatırlatıcı filtreleme seçeneği
const [filter, setFilter] = useState<
  'all' | 'soon' | 'overdue' | 'completed'
>('all')
  // 1. HATIRLATICI EKLEME
 
  // 1. HATIRLATICI EKLEME - POST API
  async function handleAddReminder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Lütfen hatırlatıcı başlığı yaz.')
      return
    }

    if (title.trim().length > 150) {
      setError('Başlık en fazla 150 karakter olabilir.')
      return
    }

    if (!dateTime) {
      setError('Lütfen tarih ve saat seç.')
      return
    }

    const selectedDate = new Date(dateTime)

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.getTime() <= Date.now()
    ) {
      setError('Lütfen gelecekteki bir tarih ve saat seç.')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:5127/api/reminders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${_props.accessToken}`
          },
          body: JSON.stringify({
            title: title.trim(),
            dateTime: selectedDate.toISOString(),
            completed: false
          })
        }
      )

      if (response.status === 401) {
        _props.onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Hatırlatıcı kaydedilemedi.')
      }

      const newReminder: Reminder = await response.json()

      setReminders(previous => [
        ...previous,
        newReminder
      ])

      setTitle('')
      setDateTime('')

    } catch {
      setError(
        'Hatırlatıcı kaydedilemedi. Backend bağlantısını kontrol et.'
      )
    }
  }


  // 2. HATIRLATICI TAMAMLAMA - PUT API
  async function handleToggleReminder(id: number) {
    const reminder = reminders.find(item => item.id === id)

    if (!reminder) return

    setError('')

    try {
      const response = await fetch(
        `http://localhost:5127/api/reminders/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${_props.accessToken}`
          },
          body: JSON.stringify({
            title: reminder.title,
            dateTime: new Date(reminder.dateTime).toISOString(),
            completed: !reminder.completed
          })
        }
      )

      if (response.status === 401) {
        _props.onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Güncelleme başarısız.')
      }

      const updatedReminder: Reminder = await response.json()

      setReminders(previous =>
        previous.map(item =>
          item.id === id ? updatedReminder : item
        )
      )

    } catch {
      setError('Hatırlatıcı güncellenemedi.')
    }
  }


  // 3. HATIRLATICI SİLME
  
  // 3. HATIRLATICI SILME - DELETE API
  async function handleDeleteReminder(id: number) {
    setError('')

    try {
      const response = await fetch(
        `http://localhost:5127/api/reminders/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${_props.accessToken}`
          }
        }
      )

      if (response.status === 401) {
        _props.onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız.')
      }

      setReminders(previous =>
        previous.filter(reminder => reminder.id !== id)
      )

    } catch {
      setError('Hatırlatıcı silinemedi. Tekrar dene.')
    }
  }


  // HATIRLATICI DURUMUNU HESAPLA
  function getReminderStatus(reminder: Reminder): string {

    if (reminder.completed) {
      return '✅ Tamamlandı'
    }

    const reminderTime = new Date(reminder.dateTime).getTime()
    const remainingTime = reminderTime - now

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
 
  // Güncel zamanı takip et
  const [now, setNow] = useState(() => Date.now())

  // Her 30 saniyede zamanı güncelle
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])


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
  : new Date(reminder.dateTime).getTime() < now
    ? 'overdue'
    : new Date(reminder.dateTime).getTime() - now <= 86400000
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
