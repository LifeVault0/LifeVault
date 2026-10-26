
import { useState, type FormEvent } from 'react'

// Sohbet mesajlarının veri yapısı
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}


interface AIAssistantProps {
  accessToken: string
  onUnauthorized: () => void
}

function AIAssistant(_props: AIAssistantProps) {


  // Sohbet mesajları
  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  // Mesaj yazma alanı
  const [input, setInput] = useState('')

  // MESAJ EKLEME (DEMO)

  // BELGELERDE ARAMA - GET API
  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const messageText = input.trim()

    if (!messageText) return

    if (messageText.length > 100) {
      alert('Arama metni en fazla 100 karakter olabilir.')
      return
    }

    setMessages(previous => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText
      }
    ])

    setInput('')

    try {
      const response = await fetch(
        `http://localhost:5127/api/documents/chunks/search?q=${encodeURIComponent(messageText)}`,
        {
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
        throw new Error('Belge arama başarısız.')
      }

      const data: {
        count: number
        results: {
          documentName: string
          content: string
        }[]
      } = await response.json()

      const answer = data.count === 0
        ? 'Belgelerinde bu ifadeyle eşleşen bir metin bulunamadı.'
        : data.results.slice(0, 3).map(result =>
            `📄 ${result.documentName}: ${result.content.slice(0, 300)}`
          ).join('\n\n')

      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer
        }
      ])

    } catch {
      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Belgelerde arama yapılamadı. Backend bağlantısını kontrol et.'
        }
      ])
    }
  }

  function handleClearChat() {
    setMessages([])
    setInput('')
  }

  return (
    <section className="documents-page ai-page">

      <h2>✨ LifeVault AI Asistan</h2>

      <p>
        Notların ve belgelerin hakkında sorular
        sorabileceğin dijital asistanın.
      </p>

      {/* AI DURUMU */}
      <div className="ai-info">
        <h3>🤖 AI Asistan</h3>

        <p>
          Merhaba! LifeVault AI Asistan
          arayüzüne hoş geldin.
        </p>
<p>
  Belgelerinde kelime veya ifade arayabilirsin.
  LifeVault, yüklediğin belgelerde eşleşen
  metinleri bulup burada gösterecek.
</p>

      </div>

      {/* SOHBET ALANI */}
      <div className="ai-chat-box">

        <div className="ai-chat-header">

          <h3>💬 Sohbet</h3>

          <button
            type="button"
            onClick={handleClearChat}
          >
            🗑️ Sohbeti Temizle
          </button>

        </div>

        <div
          className="ai-messages"
          aria-live="polite"
        >

          {messages.length === 0 ? (

            <div className="ai-empty">

              <h3>✨ Nasıl yardımcı olabilirim?</h3>

              <p>
                Sorunu aşağıdaki alana yaz.
              </p>

              <p>
                Örnek: Belgelerimde yazılım
                mühendisliği hakkında neler var?
              </p>

            </div>

          ) : (

            messages.map(message => (


<div
  key={message.id}
  className={`ai-message ${message.role}`}
>
  <strong>
    {message.role === 'user'
      ? '👤 Sen'
      : '🤖 AI Asistan'}
  </strong>

  <p>{message.content}</p>
</div>


            ))

          )}

        </div>

        {/* MESAJ YAZMA */}
        <form
          className="ai-input-form"
          onSubmit={handleSendMessage}
        >

          <label htmlFor="aiMessage">
            Mesajın:
          </label>

          <textarea
            id="aiMessage"
            placeholder="LifeVault AI Asistan'a bir şey yaz..."
            value={input}
            onChange={event =>
              setInput(event.target.value)
            }
            rows={3}
          />

          <button
            type="submit"
            disabled={!input.trim()}
          >
           🔍 Belgelerimde Ara
          </button>

        </form>

      </div>

    </section>
  )
}

export default AIAssistant
