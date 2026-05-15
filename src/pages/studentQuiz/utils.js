import { QUESTION_DURATION_MS } from './constants'

/** Per-question countdown length from DB (`time_limit` seconds). */
export function getQuestionDurationMs(question) {
  const s = Number(question?.time_limit)
  const sec = Number.isFinite(s) && s > 0 ? s : 30
  return sec * 1000
}

/** Elapsed time for a question using a captured deadline (call before clearing deadline in store). */
export function getElapsedMsForDeadline(deadlineAt, question) {
  if (!deadlineAt) return 0
  const durationMs = question ? getQuestionDurationMs(question) : QUESTION_DURATION_MS
  return Math.min(durationMs, Math.max(0, durationMs - Math.max(0, deadlineAt - Date.now())))
}

export function getElapsedMsForCurrentQuestion(snapshot) {
  const q = snapshot.questions?.[snapshot.quizIndex]
  return getElapsedMsForDeadline(snapshot.questionDeadlineAt, q)
}

export function formatElapsedMs(ms) {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m <= 0 ? `${r}s` : `${m}m ${r}s`
}

export function optionLetter(index) {
  return String.fromCharCode(65 + index)
}

/** Canonical option id (UUID/serial) — avoids Set.has / payload mismatches between number and string. */
export function normalizeOptionId(value) {
  if (value == null) return ''
  return String(value).trim()
}

/** Dedupe while preserving order. */
export function normalizeOptionIdList(raw) {
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : []
  const out = []
  const seen = new Set()
  for (const v of arr) {
    const id = normalizeOptionId(v)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/** @param {number} [fallbackSeconds] when no deadline yet (matches question `time_limit`) */
export function formatQuestionRemaining(deadlineAt, fallbackSeconds = 30) {
  if (!deadlineAt) return String(fallbackSeconds)
  return String(Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)))
}

export function totalElapsedMsFromAnswers(answers) {
  return (answers ?? []).reduce((acc, a) => acc + (typeof a.elapsedMs === 'number' ? a.elapsedMs : 0), 0)
}
