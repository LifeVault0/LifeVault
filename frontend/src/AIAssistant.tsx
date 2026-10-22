
import { useState, type FormEvent } from 'react'

// Sohbet mesajlarının veri yapısı
interface ChatMessage {
  id: string
  role: 'user'
  content: string
}

function AIAssistant() {

  // Sohbet mesajları
  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  // Mesaj yazma alanı
  const [input, setInput] = useState('')

  // MESAJ EKLEME (DEMO)
  function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const messageText = input.trim()

    if (!messageText) {
      return
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText
    }

    setMessages(previous => [
      ...previous,
      newMessage
    ])

    setInput('')
  }

  // SOHBETİ TEMİZLE
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
          Şu anda demo modundayım.
          Henüz yapay zekâ backend bağlantım yok.
          Yazdığın mesajları bu ekranda
          görüntüleyebilirsin.
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
                className="ai-message user"
              >

                <strong>👤 Sen</strong>

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
            ➤ Mesajı Ekle (Demo)
          </button>

        </form>

      </div>

    </section>
  )
}

export default AIAssistant
