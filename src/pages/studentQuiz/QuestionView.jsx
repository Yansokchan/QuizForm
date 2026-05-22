import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMultiSelectQuestion } from '../../lib/questionTypes'
import { formatQuestionRemaining, getQuestionDurationMs, normalizeOptionId, normalizeOptionIdList, optionLetter } from './utils'

const COUNTDOWN_RING_R = 20
const COUNTDOWN_RING_C = 2 * Math.PI * COUNTDOWN_RING_R

function StudentQuestionCountdownRing({ deadlineAt, durationMs, onComplete, disabled, secondsLabel }) {
  const pathRef = useRef(null)
  const doneRef = useRef(false)
  const rafRef = useRef(0)

  useEffect(() => {
    doneRef.current = false
  }, [deadlineAt])

  useEffect(() => {
    if (disabled || !deadlineAt) return undefined
    const tick = () => {
      if (doneRef.current) return
      const remaining = Math.max(0, deadlineAt - Date.now())
      const t = Math.min(1, remaining / durationMs)
      const offset = COUNTDOWN_RING_C * (1 - t)
      const el = pathRef.current
      if (el) {
        el.style.strokeDashoffset = String(offset)
        el.setAttribute('stroke', t < 0.33 ? 'var(--sq-ring-red)' : t < 0.66 ? 'var(--sq-ring-amber)' : 'var(--sq-ring-purple)')
      }
      if (remaining <= 0) {
        doneRef.current = true
        onComplete()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [deadlineAt, durationMs, onComplete, disabled])

  const sec = Math.round(durationMs / 1000)
  const label = secondsLabel ?? String(sec)

  return (
    <div className="sq-timer-inline" role="timer" aria-label={`${label} seconds remaining`}>
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={COUNTDOWN_RING_R} fill="none" stroke="var(--sq-border)" strokeWidth="3.5" />
        <circle
          ref={pathRef}
          cx="26"
          cy="26"
          r={COUNTDOWN_RING_R}
          fill="none"
          stroke="var(--sq-ring-purple)"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          strokeDasharray={COUNTDOWN_RING_C}
          strokeDashoffset="0"
        />
      </svg>
      <span className="sq-timer-num">{label}s</span>
    </div>
  )
}

export function StudentQuizQuestionView({ snapshot, onDeadlineSet, onTimeout, onSubmitAnswer }) {
  const { questions, quizIndex, questionDeadlineAt } = snapshot
  const q = questions[quizIndex]
  const durationMs = useMemo(() => (q ? getQuestionDurationMs(q) : 30_000), [q])
  const fallbackSec = useMemo(() => Math.round(durationMs / 1000), [durationMs])
  const multi = useMemo(() => isMultiSelectQuestion(q), [q])
  const [singleId, setSingleId] = useState(null)
  const [multiSet, setMultiSet] = useState(() => new Set())
  const [submitErr, setSubmitErr] = useState('')
  const [progressTick, setProgressTick] = useState(0)
  const expiredRef = useRef(false)

  const hydrateFromAnswer = useCallback(() => {
    const ans = snapshot.answers?.[quizIndex]
    if (!ans) {
      setSingleId(null)
      setMultiSet(new Set())
      return
    }
    if (isMultiSelectQuestion(q)) {
      setMultiSet(new Set(normalizeOptionIdList(Array.isArray(ans.selected_option_ids) ? ans.selected_option_ids : [])))
      setSingleId(null)
    } else {
      setSingleId(normalizeOptionId(ans.selected_option_id) || null)
      setMultiSet(new Set())
    }
  }, [snapshot.answers, quizIndex, q])

  useEffect(() => {
    setSubmitErr('')
    expiredRef.current = false
    hydrateFromAnswer()
  }, [q?.id, quizIndex, hydrateFromAnswer])

  useEffect(() => {
    if (!q || questionDeadlineAt) return
    onDeadlineSet(Date.now() + durationMs)
  }, [q?.id, quizIndex, questionDeadlineAt, onDeadlineSet, q, durationMs])

  useEffect(() => {
    if (!questionDeadlineAt) return
    const id = setInterval(() => {
      setProgressTick((t) => t + 1)
      if (Date.now() >= questionDeadlineAt && !expiredRef.current) {
        expiredRef.current = true
        onTimeout()
      }
    }, 120)
    return () => clearInterval(id)
  }, [questionDeadlineAt, onTimeout])

  const fireTimeout = () => {
    if (expiredRef.current) return
    expiredRef.current = true
    onTimeout()
  }

  const total = questions.length
  void progressTick

  const toggleMulti = (id) => {
    const key = normalizeOptionId(id)
    if (!key) return
    setMultiSet((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
    setSubmitErr('')
  }

  const pickSingle = (id) => {
    setSingleId(normalizeOptionId(id) || null)
    setSubmitErr('')
  }

  const handleSubmit = () => {
    if (multi) {
      if (multiSet.size === 0) {
        setSubmitErr('Select at least one answer.')
        return
      }
      onSubmitAnswer({ kind: 'multi', optionIds: Array.from(multiSet) })
    } else {
      if (!singleId) {
        setSubmitErr('Select at least one answer.')
        return
      }
      onSubmitAnswer({ kind: 'single', optionId: singleId })
    }
  }

  if (!q) return null
  const options = q.options ?? []
  const secondsLabel = formatQuestionRemaining(questionDeadlineAt, fallbackSec)
  const hasSelection = multi ? multiSet.size > 0 : Boolean(singleId)

  return (
    <div className="sq-step-enter">
      <div className="sq-progress-wrap">
        <div className="sq-progress-meta">
          <span className="sq-progress-meta-left">Question {quizIndex + 1} of {total}</span>
        </div>
      </div>

      <div className="sq-dots">
        {questions.map((_, i) => (
          <span
            key={i}
            className={`sq-dot${i < quizIndex ? ' sq-dot-done' : i === quizIndex ? ' sq-dot-current' : ''}`}
          />
        ))}
      </div>

      <div className="sq-card clay-element">
        <div className="sq-card-head">
          <div className={`sq-badge ${multi ? 'sq-badge-multi' : 'sq-badge-single'}`}>
            <i className={multi ? 'ti ti-checkbox' : 'ti ti-circle-dot'} aria-hidden="true" />
            {multi ? 'Select all that apply' : 'Single answer'}
          </div>
          {questionDeadlineAt && (
            <StudentQuestionCountdownRing
              deadlineAt={questionDeadlineAt}
              durationMs={durationMs}
              onComplete={fireTimeout}
              disabled={false}
              secondsLabel={secondsLabel}
            />
          )}
        </div>

        <h2 className="sq-title" style={{ fontSize: '1.05rem', marginBottom: '1.1rem' }}>{q.question_text}</h2>

        <div style={{ display: 'grid', gap: '8px' }}>
          {options.map((opt, idx) => {
            const optKey = normalizeOptionId(opt.id ?? opt.option_id)
            const selected = multi ? multiSet.has(optKey) : singleId === optKey
            return (
              <button
                key={optKey || idx}
                type="button"
                className={`sq-option${selected ? ' sq-option-selected' : ''}`}
                onClick={() => (multi ? toggleMulti(opt.id ?? opt.option_id) : pickSingle(opt.id ?? opt.option_id))}
              >
                <span className={`sq-option-key${multi ? ' sq-option-key-multi' : ''}`} aria-hidden="true">
                  {optionLetter(idx)}
                </span>
                <span>{opt.option_text}</span>
              </button>
            )
          })}
        </div>

        {submitErr && <p className="sq-error" style={{ marginTop: '0.75rem' }}>{submitErr}</p>}

        <div className="sq-row-actions sq-row-actions--full">
          <button
            type="button"
            className="sq-btn sq-btn-primary"
            onClick={handleSubmit}
            disabled={!hasSelection}
          >
            <i className="ti ti-arrow-right" aria-hidden="true" />
            Submit answer
          </button>
        </div>
      </div>
    </div>
  )
}
