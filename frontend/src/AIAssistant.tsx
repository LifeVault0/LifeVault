
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from 'react'


// Sohbet mesajlarının veri yapısı
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Backend bağlantısı
interface AIAssistantProps {
  accessToken: string
  onUnauthorized: () => void
}

// Belge arama API'sinden dönen veri
interface SearchResult {
  documentName: string
  content: string
}

interface SearchResponse {
  count: number
  results: SearchResult[]
}

function AIAssistant(_props: AIAssistantProps) {

  // Sohbet mesajları
  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  // Mesaj yazma alanı
  const [input, setInput] = useState('')

  // API yüklenme durumu
  const [isLoading, setIsLoading] = useState(false)

  // Hata mesajı
  const [error, setError] = useState('')

  // Sohbet alanının referansı
  const messagesContainerRef =
    useRef<HTMLDivElement>(null)

  // OTOMATİK KAYDIRMA
  useEffect(() => {
    const container = messagesContainerRef.current

    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

  // BELGELERDE ARAMA - GET API
  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isLoading) return

    const messageText = input.trim()

    if (!messageText) return

    if (messageText.length > 100) {
      setError(
        'Arama metni en fazla 100 karakter olabilir.'
      )
      return
    }

    setError('')

    // Kullanıcının mesajını ekle
    setMessages(previous => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText
      }
    ])

    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(
        `http://localhost:5127/api/documents/chunks/search?q=${encodeURIComponent(messageText)}`,
        {
          headers: {
            Authorization: `Bearer ${_props.accessToken}`
          }
        }
      )

      // Oturum süresi dolmuşsa
      if (response.status === 401) {
        _props.onUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Belge araması başarısız.')
      }

      const data: SearchResponse =
        await response.json()

      // Belge arama sonucunu hazırla
      const answer =
        data.results.length === 0
          ? 'Belgelerinde bu ifadeyle eşleşen bir metin bulunamadı.'
          : data.results
              .slice(0, 3)
              .map(result =>
                `📄 ${result.documentName}\n\n${result.content.slice(0, 300)}`
              )
              .join('\n\n────────────\n\n')

      // Sonucu sohbete ekle
      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer
        }
      ])

    } catch {
      setError(
        'Belge araması yapılamadı. Backend bağlantısını kontrol et.'
      )

      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Üzgünüm, arama sırasında bir sorun oluştu. Lütfen tekrar dene.'
        }
      ])

    } finally {
      setIsLoading(false)
    }
  }

  // ENTER İLE MESAJ GÖNDERME
  function handleMessageKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()

      if (isLoading || !input.trim()) return

      event.currentTarget.form?.requestSubmit()
    }
  }

  // SOHBETİ TEMİZLE
  function handleClearChat() {
    if (isLoading) return

    setMessages([])
    setInput('')
    setError('')
  }

  return (
    <section className="documents-page ai-page">

      <h2>✨ LifeVault AI Asistan</h2>

      <p>
        Notların ve belgelerin hakkında sorular
        sorabileceğin dijital asistanın.
      </p>

      {/* AI BİLGİ ALANI */}
      <div className="ai-info">

        <h3>🤖 AI Asistan</h3>

        <p>
          Merhaba! LifeVault AI Asistan
          arayüzüne hoş geldin.
        </p>

        <p>
          Şu anda belgelerinde kelime veya
          ifade arayabilirsin.
          LifeVault, yüklediğin belgelerde
          eşleşen metinleri bulup gösterecek.
        </p>

      </div>

      {/* SOHBET ALANI */}
      <div className="ai-chat-box">

        {/* SOHBET BAŞLIĞI */}
        <div className="ai-chat-header">

          <h3>💬 Sohbet</h3>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={isLoading}
          >
            🗑️ Sohbeti Temizle
          </button>

        </div>

        {/* MESAJLAR */}
        <div
          className="ai-messages"
          aria-live="polite"
          ref={messagesContainerRef}
        >

          {messages.length === 0 && !isLoading ? (

            <div className="ai-empty">

              <h3>
                ✨ Nasıl yardımcı olabilirim?
              </h3>

              <p>
                Belgelerinde aramak istediğin
                kelimeyi aşağıya yaz.
              </p>

              <p>
                Örnek: yazılım mühendisliği
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

                <p
                  style={{
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {message.content}
                </p>

              </div>

            ))

          )}

          {/* YÜKLENİYOR GÖSTERGESİ */}
          {isLoading && (

            <div
              className="ai-message assistant"
              role="status"
            >

              <strong>
                🤖 AI Asistan
              </strong>

              <p>
                ⏳ Belgelerinde aranıyor...
              </p>

            </div>

          )}

        </div>

        {/* HATA MESAJI */}
        {error && (

          <p
            role="alert"
            style={{
              color: '#dc2626',
              marginTop: '12px'
            }}
          >
            ⚠️ {error}
          </p>

        )}

        {/* MESAJ GÖNDERME FORMU */}
        <form
          className="ai-input-form"
          onSubmit={handleSendMessage}
        >

          <label htmlFor="aiMessage">
            Mesajın:
          </label>

          <textarea
            id="aiMessage"
            placeholder="Belgelerinde aramak istediğin kelimeyi yaz..."
            value={input}
            onChange={event =>
              setInput(event.target.value)
            }
            onKeyDown={handleMessageKeyDown}
            rows={3}
            maxLength={100}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
          >
            {isLoading
              ? '⏳ Belgelerde aranıyor...'
              : '🔍 Belgelerimde Ara'}
          </button>

        </form>

      </div>

    </section>
  )
}

export default AIAssistant
