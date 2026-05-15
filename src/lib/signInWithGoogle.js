import { supabase } from './supabase'

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/dashboard`
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
}
