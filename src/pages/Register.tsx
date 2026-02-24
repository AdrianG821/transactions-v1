import { useState } from 'react'
import { register } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { setUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { user, accessToken } = await register({ name, email, password })
      localStorage.setItem('token', accessToken)
      setUser(user as any)
      window.location.href = '/transactions'
    } catch (err: any) {
      setError(err?.message ?? 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required minLength={2} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required minLength={8} />
        <button disabled={loading} type="submit">{loading ? '...' : 'Create account'}</button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <p><a href="/login">I already have an account</a></p>
    </div>
  )
}