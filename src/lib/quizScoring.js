import { optionIsMarkedCorrect } from './questionTypes'

function parseSelectedIdList(raw) {
  let v = raw
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch {
      return []
    }
  }
  if (Array.isArray(v)) {
    return v.map((id) => String(id ?? '').trim()).filter((id) => id.length > 0)
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return Object.values(v)
      .map((id) => String(id ?? '').trim())
      .filter((id) => id.length > 0)
  }
  return []
}

function normalizeSelectedIds(ans) {
  const fromArr = parseSelectedIdList(ans.selected_option_ids)
  const solo = ans.selected_option_id != null ? String(ans.selected_option_id).trim() : ''
  const merged = solo ? [...fromArr, solo] : [...fromArr]
  const u = [...new Set(merged)].sort()
  return u.length ? u : null
}

function correctOptionIds(question) {
  const opts = question?.options ?? []
  return opts
    .filter((o) => optionIsMarkedCorrect(o))
    .map((o) => String(o.id ?? '').trim())
    .filter((id) => id.length > 0)
    .sort()
}

function isMultiQuestion(question) {
  return correctOptionIds(question).length > 1
}

function setsEqualSorted(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function optionTextMap(question) {
  const m = new Map()
  for (const o of question?.options ?? []) {
    const id = String(o.id ?? '').trim()
    if (id) m.set(id, o.option_text)
  }
  return m
}

/**
 * Score answers client-side using the same rules as submit-quiz edge function.
 * @param {Array<{ id: string, question_text: string, order_index: number, time_limit: number, options?: Array<{ id: string, option_text: string, is_correct?: unknown }> }>} questions
 * @param {Array<{ question_id: string, time_taken?: number, selected_option_id?: string | null, selected_option_ids?: unknown }>} submitAnswers
 */
export function scoreQuizAnswers(questions, submitAnswers) {
  const orderMap = new Map(questions.map((q, i) => [q.id, q.order_index ?? i]))
  let totalScore = 0

  const scored = submitAnswers.map((ans) => {
    const question = questions.find((q) => String(q.id) === String(ans.question_id))
    const correctIds = correctOptionIds(question)
    const selectedSorted = normalizeSelectedIds(ans)
    const isSkipped = !selectedSorted || selectedSorted.length === 0
    const multi = isMultiQuestion(question)

    let isCorrect = false
    if (!isSkipped && correctIds.length > 0) {
      if (multi) {
        isCorrect = setsEqualSorted(correctIds, selectedSorted)
      } else {
        isCorrect = selectedSorted.length === 1 && selectedSorted[0] === correctIds[0]
      }
    }

    const timeLimit = Math.max(1, Number(question?.time_limit ?? 30))
    const rawTaken = Number(ans.time_taken ?? timeLimit)
    const timeTaken = Math.max(0, Math.min(Number.isFinite(rawTaken) ? rawTaken : timeLimit, timeLimit))

    let points = 0
    if (isCorrect) {
      const bonus = ((timeLimit - timeTaken) / timeLimit) * 50
      points = Number.isFinite(bonus) ? 100 + bonus : 100
    }
    totalScore += Number.isFinite(points) ? points : 0

    const texts = optionTextMap(question)
    const selectedTexts = isSkipped ? [] : selectedSorted.map((id) => texts.get(id) ?? '')
    const correctTexts = correctIds.map((id) => texts.get(id) ?? '').filter(Boolean)

    return {
      question_id: ans.question_id,
      question_text: question?.question_text ?? '',
      order_index: orderMap.get(ans.question_id) ?? 0,
      selected_option_text: isSkipped ? '(skipped)' : selectedTexts.join('; ') || '(skipped)',
      correct_option_text: correctTexts.join('; '),
      score: Number(points.toFixed(2)),
      time_taken: timeTaken,
    }
  })

  scored.sort((a, b) => Number(a.order_index) - Number(b.order_index))

  const safeTotal = Number.isFinite(totalScore) ? totalScore : 0
  return {
    total_score: Number(safeTotal.toFixed(2)),
    breakdown: scored,
  }
}
