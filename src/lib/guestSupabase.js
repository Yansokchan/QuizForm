import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * Supabase client that never uses a teacher session — for student quiz pages.
 * Ensures public (anon) RLS policies apply even if a teacher is logged in elsewhere.
 */
export const guestSupabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
