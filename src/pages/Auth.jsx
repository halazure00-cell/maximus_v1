import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Auth = () => {
  const { signIn, signUp, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const action = mode === 'login' ? signIn : signUp
    const { error: authError } = await action(email, password)
    if (authError) {
      setError(authError.message)
    }
    setLoading(false)
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Rute Cepat</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          {mode === 'login' ? 'Masuk' : 'Daftar Akun'}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Catat trip dan pendapatan dengan cepat.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-primary"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-primary"
            required
          />
          {error ? <p className="text-xs text-sunrise-300">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <button
          className="mt-4 w-full text-xs text-white/60"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login'
            ? 'Belum punya akun? Daftar'
            : 'Sudah punya akun? Masuk'}
        </button>
      </div>
    </div>
  )
}

export default Auth
