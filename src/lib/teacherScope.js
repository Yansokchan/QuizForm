import { supabase } from './supabase'

/** Current signed-in teacher id, or null if not authenticated. */
export async function getCurrentTeacherId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.id) return null
  return user.id
}
