import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type OptionRow = { id: string; option_text: string; is_correct: boolean }
type QuestionRow = {
  id: string
  question_text: string
  order_index: number
  time_limit: number
  options?: OptionRow[]
}

type RawAnswer = {
  question_id: string
  time_taken?: number
  selected_option_id?: string | null
  selected_option_ids?: unknown
}

function optionIsMarkedCorrect(o: OptionRow | undefined): boolean {
  if (!o || typeof o !== 'object') return false
  const v = (o as { is_correct?: unknown }).is_correct
  return v === true || v === 1 || v === 'true' || v === '1'
}

function parseSelectedIdList(raw: unknown): string[] {
  let v: unknown = raw
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v) as unknown
    } catch {
      return []
    }
  }
  if (Array.isArray(v)) {
    return v.map((id) => String(id ?? '').trim()).filter((id) => id.length > 0)
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return Object.values(v as Record<string, unknown>)
      .map((id) => String(id ?? '').trim())
      .filter((id) => id.length > 0)
  }
  return []
}

function normalizeSelectedIds(ans: RawAnswer): string[] | null {
  const fromArr = parseSelectedIdList(ans.selected_option_ids)
  const solo = ans.selected_option_id != null ? String(ans.selected_option_id).trim() : ''
  const merged = solo ? [...fromArr, solo] : [...fromArr]
  const u = [...new Set(merged)].sort()
  return u.length ? u : null
}

function correctOptionIds(question: QuestionRow | undefined): string[] {
  const opts = question?.options ?? []
  return opts
    .filter((o) => optionIsMarkedCorrect(o))
    .map((o) => String(o.id ?? '').trim())
    .filter((id) => id.length > 0)
    .sort()
}

function isMultiQuestion(question: QuestionRow | undefined): boolean {
  return correctOptionIds(question).length > 1
}

function setsEqualSorted(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function optionTextMap(question: QuestionRow | undefined): Map<string, string> {
  const m = new Map<string, string>()
  for (const o of question?.options ?? []) {
    const id = String(o.id ?? '').trim()
    if (id) m.set(id, o.option_text)
  }
  return m
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const { submission_id, answers, student_name, quiz_class_id } = await req.json()
    if (!submission_id || !Array.isArray(answers)) {
      return json({ error: 'Invalid payload' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: submissionRow, error: submissionErr } = await supabase
      .from('submissions')
      .select('id, submitted_at')
      .eq('id', submission_id)
      .maybeSingle()
    if (submissionErr) throw submissionErr
    if (!submissionRow) {
      return json({ error: 'Submission not found' }, 404)
    }
    if (submissionRow.submitted_at) {
      return json({ error: 'This submission is already completed.' }, 409)
    }

    const questionIds = [...new Set(answers.map((a: RawAnswer) => a.question_id))]
    const { data: questionRows, error: qErr } = await supabase
      .from('questions')
      .select('id,question_text,order_index,time_limit,options(id,option_text,is_correct)')
      .in('id', questionIds)
      .order('order_index')

    if (qErr) throw qErr

    const orderMap = new Map((questionRows ?? []).map((q: QuestionRow, i: number) => [q.id, q.order_index ?? i]))

    let totalScore = 0
    const scoredAnswers = (answers as RawAnswer[]).map((ans) => {
      const question = (questionRows as QuestionRow[] | null | undefined)?.find((q) => String(q.id) === String(ans.question_id))
      const correctIds = correctOptionIds(question)
      const selectedSorted = normalizeSelectedIds(ans)
      const isSkipped = !selectedSorted || selectedSorted.length === 0
      const multi = isMultiQuestion(question)

      let isCorrect = false
      if (!isSkipped && correctIds.length > 0) {
        if (multi) {
          isCorrect = setsEqualSorted(correctIds, selectedSorted!)
        } else {
          isCorrect = selectedSorted!.length === 1 && selectedSorted![0] === correctIds[0]
        }
      }

      const timeLimit = Math.max(1, Number(question?.time_limit ?? 30))
      const rawTaken = Number(ans.time_taken ?? timeLimit)
      const timeTaken = Math.max(
        0,
        Math.min(Number.isFinite(rawTaken) ? rawTaken : timeLimit, timeLimit),
      )
      let points = 0
      if (isCorrect) {
        const bonus = ((timeLimit - timeTaken) / timeLimit) * 50
        points = Number.isFinite(bonus) ? 100 + bonus : 100
      }
      totalScore += Number.isFinite(points) ? points : 0

      const texts = optionTextMap(question)
      const selectedTexts = isSkipped ? [] : (selectedSorted ?? []).map((id) => texts.get(id) ?? '')
      const correctTexts = correctIds.map((id) => texts.get(id) ?? '').filter(Boolean)

      const insertRow: Record<string, unknown> = {
        submission_id,
        question_id: ans.question_id,
        time_taken: timeTaken,
        score: Number(points.toFixed(2)),
      }

      if (multi) {
        insertRow.selected_option_id = null
        insertRow.selected_option_ids = selectedSorted ?? []
      } else {
        insertRow.selected_option_id = isSkipped ? null : selectedSorted![0]
        insertRow.selected_option_ids = null
      }

      return {
        ...insertRow,
        _breakdown_selected_text: isSkipped ? '(skipped)' : selectedTexts.join('; ') || '(skipped)',
        _breakdown_correct_text: correctTexts.join('; '),
      }
    })

    const insertPayload = scoredAnswers.map(({ _breakdown_selected_text, _breakdown_correct_text, ...row }) => row)

    const safeTotal = Number.isFinite(totalScore) ? totalScore : 0
    const totalScoreFixed = Number(safeTotal.toFixed(2))

    const { error: insertErr } = await supabase.from('answers').insert(insertPayload)
    if (insertErr) {
      const msg = [insertErr.message, insertErr.details, insertErr.hint].filter(Boolean).join(' | ')
      throw new Error(`answers insert failed: ${msg || JSON.stringify(insertErr)}`)
    }

    const updatePayload: Record<string, unknown> = {
      total_score: totalScoreFixed,
      submitted_at: new Date().toISOString(),
    }
    if (typeof student_name === 'string' && student_name.trim().length > 0) {
      updatePayload.student_name = student_name.trim()
    }
    if (typeof quiz_class_id === 'string' && quiz_class_id.length > 0) {
      updatePayload.quiz_class_id = quiz_class_id
    }

    const { error: updateErr } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', submission_id)
    if (updateErr) throw updateErr

    const breakdown = scoredAnswers.map((row) => {
      const question = (questionRows as QuestionRow[] | null | undefined)?.find((q) => q.id === row.question_id)
      return {
        question_id: row.question_id,
        question_text: question?.question_text ?? '',
        order_index: orderMap.get(row.question_id) ?? 0,
        selected_option_text: String(row._breakdown_selected_text ?? ''),
        correct_option_text: String(row._breakdown_correct_text ?? ''),
        score: row.score,
        time_taken: row.time_taken,
      }
    })
    breakdown.sort((a, b) => Number(a.order_index) - Number(b.order_index))

    return json({
      total_score: totalScoreFixed,
      answers: insertPayload,
      breakdown,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return json({ error: message }, 500)
  }
})
