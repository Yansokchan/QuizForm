import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { signInWithGoogle } from '../../lib/signInWithGoogle'
import './AuthLoginDialog.css'

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function AuthLoginDialog({ open, onOpenChange }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const panelRef = useRef(null)

  const close = useCallback(() => {
    if (busy) return
    onOpenChange(false)
    setError('')
  }, [busy, onOpenChange])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const handleGoogleLogin = async () => {
    setError('')
    setBusy(true)
    const { error: authError } = await signInWithGoogle()
    if (authError) {
      setError(authError.message)
      setBusy(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="auth-login-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={panelRef}
        className="auth-login-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-login-title"
        aria-describedby="auth-login-desc"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-login-close" onClick={close} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 id="auth-login-title" className="auth-login-title">
          Sign in to QuizForm
        </h2>
        <p id="auth-login-desc" className="auth-login-subtitle">
          Create quizzes, share links with your class, and review results from your dashboard.
        </p>

        <button
          type="button"
          className={`auth-login-google${busy ? ' is-busy' : ''}`}
          onClick={handleGoogleLogin}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? (
            <Loader2 className="auth-login-spinner" size={20} aria-hidden="true" />
          ) : (
            <GoogleMark />
          )}
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {error && <p className="auth-login-error">{error}</p>}

        <p className="auth-login-footnote">
          Students join quizzes via shared links — no account required.
        </p>
      </div>
    </div>,
    document.body,
  )
}
