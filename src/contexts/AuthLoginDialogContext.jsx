import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import AuthLoginDialog from '../components/auth/AuthLoginDialog'

const AuthLoginDialogContext = createContext(null)

export function AuthLoginDialogProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openLogin = useCallback(() => setOpen(true), [])
  const closeLogin = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ open, openLogin, closeLogin, setOpen }),
    [open, openLogin, closeLogin],
  )

  return (
    <AuthLoginDialogContext.Provider value={value}>
      {children}
      <AuthLoginDialog open={open} onOpenChange={setOpen} />
    </AuthLoginDialogContext.Provider>
  )
}

export function useAuthLoginDialog() {
  const ctx = useContext(AuthLoginDialogContext)
  if (!ctx) {
    throw new Error('useAuthLoginDialog must be used within AuthLoginDialogProvider')
  }
  return ctx
}
