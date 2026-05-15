export const ATTEMPT_STORAGE_VERSION = 1
export const COMPLETED_STORAGE_VERSION = 1
/** Cached last submitted result for a student link (per browser, per quiz token). */
export const RESULT_CACHE_VERSION = 1

function resultCacheStorageKey(completedKey) {
  return completedKey ? `${completedKey}:result` : ''
}

export function loadAttemptFromStorage(key) {
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== ATTEMPT_STORAGE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAttemptStorage(key) {
  if (!key) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures and continue quiz flow.
  }
}

export function saveAttemptToStorage(key, payload) {
  if (!key) return
  try {
    window.localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // Ignore storage failures and continue quiz flow.
  }
}

export function normalizeStudentName(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function buildCompletedEntryKey({ quizId, classId, studentName }) {
  return `${quizId}::${classId}::${normalizeStudentName(studentName)}`
}

export function loadCompletedAttemptSet(key) {
  if (!key) return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== COMPLETED_STORAGE_VERSION || !Array.isArray(parsed.entries)) return new Set()
    return new Set(parsed.entries.filter((entry) => typeof entry === 'string'))
  } catch {
    return new Set()
  }
}

export function addCompletedAttemptToStorage(key, identity) {
  if (!key) return
  const set = loadCompletedAttemptSet(key)
  set.add(buildCompletedEntryKey(identity))
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: COMPLETED_STORAGE_VERSION,
        entries: Array.from(set),
      }),
    )
  } catch {
    // Ignore storage failures and continue quiz flow.
  }
}

export function loadLastCompletedFromStorage(key) {
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(`${key}:last`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function saveLastCompletedToStorage(key, payload) {
  if (!key) return
  try {
    window.localStorage.setItem(`${key}:last`, JSON.stringify(payload))
  } catch {
    // Ignore storage failures and continue quiz flow.
  }
}

export function summarizeFromBreakdown(breakdown) {
  let correct = 0
  let wrong = 0
  let skipped = 0
  breakdown.forEach((row) => {
    if (row.selected_option_text === '(skipped)') skipped += 1
    else if (Number(row.score) > 0) correct += 1
    else wrong += 1
  })
  return { correct, wrong, skipped }
}

export function saveStudentQuizResultCache(completedKey, payload) {
  const sk = resultCacheStorageKey(completedKey)
  if (!sk || !payload) return
  try {
    window.localStorage.setItem(sk, JSON.stringify({ ...payload, version: RESULT_CACHE_VERSION }))
  } catch {
    // ignore
  }
}

export function loadStudentQuizResultCache(completedKey) {
  const sk = resultCacheStorageKey(completedKey)
  if (!sk) return null
  try {
    const raw = window.localStorage.getItem(sk)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== RESULT_CACHE_VERSION) return null
    if (!parsed.quizId || !Array.isArray(parsed.breakdown)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearStudentQuizResultCache(completedKey) {
  const sk = resultCacheStorageKey(completedKey)
  if (!sk) return
  try {
    window.localStorage.removeItem(sk)
  } catch {
    // ignore
  }
}
