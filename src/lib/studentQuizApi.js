/**
 * Student quiz edge functions are guest-facing — always call with the anon key,
 * never a teacher (or other) logged-in session JWT.
 */
export function getSupabasePublicConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function studentQuizFunctionHeaders(anonKey) {
  return {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }
}

export async function invokeStudentQuizFunction(functionName, body) {
  const config = getSupabasePublicConfig()
  if (!config) {
    throw new Error('App is missing Supabase configuration.')
  }
  const res = await fetch(`${config.url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: studentQuizFunctionHeaders(config.anonKey),
    body: JSON.stringify(body),
  })
  let data = {}
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const msg = data.error ?? data.message ?? `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}
