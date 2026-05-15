import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import './AppPages.css'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const [error, setError] = useState('')

  const login = async () => {
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (authError) setError(authError.message)
  }

  if (loading) return <div className="container page-shell">Loading...</div>
  if (session) return <Navigate to="/dashboard" replace />

  return (
    <main className="container page-shell">
      <div className="card login-card">
        <h2>Teacher Login</h2>
        <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Use Google OAuth to continue.</p>
        <button className="btn primary" type="button" onClick={login}>Continue with Google</button>
        {error && <p className="text-danger">{error}</p>}
      </div>
    </main>
  )
}
