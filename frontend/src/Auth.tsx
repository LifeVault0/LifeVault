
import { useState, type FormEvent } from 'react'

interface AuthProps {
  onLogin: (accessToken: string) => void
}

interface LoginResponse {
  accessToken: string
}

function Auth({ onLogin }: AuthProps) {

  // Giriş mi, kayıt mı?
  const [mode, setMode] =
    useState<'login' | 'register'>('login')

  // Kullanıcı bilgileri
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // İşlem durumları
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    const isLogin = mode === 'login'

    const endpoint = isLogin
      ? 'http://localhost:5127/api/auth/login?useCookies=false'
      : 'http://localhost:5127/api/auth/register'

    try {

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      })

      if (!response.ok) {
        throw new Error(
          isLogin
            ? 'Giriş başarısız. Bilgilerini kontrol et.'
            : 'Kayıt oluşturulamadı. Şifre kurallarını kontrol et.'
        )
      }

      if (!isLogin) {
        setMessage('Kayıt başarılı! Şimdi giriş yapabilirsin.')
        setMode('login')
        setPassword('')
        return
      }

      const data: LoginResponse = await response.json()

      if (!data.accessToken) {
        throw new Error('Sunucudan erişim tokenı alınamadı.')
      }

      // Tokenı App.tsx bileşenine gönder
      onLogin(data.accessToken)

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sunucuya bağlanılamadı.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">

      <div className="auth-card">

        <h1>🔐 LifeVault</h1>

        <p>Kişisel dijital çalışma alanın</p>

        <h2>
          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>

        <form onSubmit={handleSubmit}>

          <label htmlFor="email">
            E-posta
          </label>

          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-posta adresin"
          />

          <label htmlFor="password">
            Şifre
          </label>

          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Şifren"
          />

          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}

          {message && (
            <p role="status">{message}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Lütfen bekle...'
              : mode === 'login'
                ? 'Giriş Yap'
                : 'Kayıt Ol'}
          </button>

        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
            setMessage('')
          }}
        >
          {mode === 'login'
            ? 'Hesabın yok mu? Kayıt ol'
            : 'Zaten hesabın var mı? Giriş yap'}
        </button>

      </div>

    </main>
  )
}

export default Auth
