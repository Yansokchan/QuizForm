import { useEffect, useMemo, useState } from 'react'
import { summarizeFromBreakdown } from '../../lib/studentQuizAttemptStorage'
import { formatElapsedMs, totalElapsedMsFromAnswers } from './utils'

const SCORE_RING_R = 52
const SCORE_RING_C = 2 * Math.PI * SCORE_RING_R

function gradeFromPct(pct) {
  if (pct >= 90) return { letter: 'A', label: 'Excellent', className: 'sq-grade-a clay-element' }
  if (pct >= 75) return { letter: 'B', label: 'Good', className: 'sq-grade-b clay-element' }
  if (pct >= 60) return { letter: 'C', label: 'Average', className: 'sq-grade-c clay-element' }
  return { letter: 'D', label: 'Needs improvement', className: 'sq-grade-d clay-element' }
}

function scoreStrokeColor(pct) {
  if (pct >= 75) return 'var(--sq-score-high)'
  if (pct >= 60) return 'var(--sq-score-mid)'
  return 'var(--sq-score-low)'
}

export function StudentResultsView({ snapshot }) {
  const { serverBreakdown, serverScore, questions } = snapshot
  const stats = useMemo(() => summarizeFromBreakdown(serverBreakdown), [serverBreakdown])
  const totalQ = serverBreakdown.length || questions.length || 1
  const correct = stats.correct
  const pct = Math.round((correct / totalQ) * 100)
  const grade = gradeFromPct(pct)
  const [animated, setAnimated] = useState(0)
  const totalMs = totalElapsedMsFromAnswers(snapshot.answers)

  useEffect(() => {
    setAnimated(0)
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setAnimated(pct))
    })
    return () => cancelAnimationFrame(id)
  }, [pct])

  const offset = SCORE_RING_C * (1 - animated / 100)
  const stroke = scoreStrokeColor(pct)

  return (
    <div className="sq-step-enter">
      <div className="sq-logo-badge clay-element flex items-center gap-2">
        <i className="ti ti-trophy" aria-hidden="true" />
        Quiz complete
      </div>

      <div className="sq-card backdrop-blur-sm clay-element bg-white/50">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div className="sq-score-ring-wrap">
            <div className="sq-score-ring-inner" role="img" aria-label={`Score ${pct} percent`}>
              <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
                <circle cx="70" cy="70" r={SCORE_RING_R} fill="none" stroke="var(--sq-border-subtle)" strokeWidth="9" />
                <circle
                  cx="70"
                  cy="70"
                  r={SCORE_RING_R}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="9"
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  strokeDasharray={SCORE_RING_C}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 1.15s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
                />
              </svg>
              <span className="sq-score-ring-pct">{Math.round(animated)}%</span>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--sq-text-muted)', margin: '0.35rem 0 0.85rem' }}>
            {correct} / {totalQ} correct
          </p>

          <span
            className={grade.className}
            style={{
              display: 'inline-block',
              padding: '5px 18px',
              borderRadius: 'var(--sq-radius-pill)',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: '0.5rem',
            }}
          >
            {grade.label} - Grade {grade.letter}
          </span>

          <p style={{ fontSize: '13px', color: 'var(--sq-text-muted)' }}>
            {snapshot.register.fullName.trim()} · {snapshot.classes.find((c) => c.id === snapshot.register.classId)?.class_name ?? ''}
          </p>
        </div>

        <hr className="sq-divider" />

        <div className="sq-grid-2">
          <div className="sq-stat-cell clay-element">
            <span className="sq-stat-value" style={{ color: 'var(--sq-success)' }}>{stats.correct}</span>
            <div className="sq-stat-label">Correct</div>
          </div>
          <div className="sq-stat-cell clay-element">
            <span className="sq-stat-value" style={{ color: 'var(--sq-danger)' }}>{stats.wrong}</span>
            <div className="sq-stat-label">Incorrect</div>
          </div>
          <div className="sq-stat-cell clay-element">
            <span className="sq-stat-value">{formatElapsedMs(totalMs)}</span>
            <div className="sq-stat-label">Time taken</div>
          </div>
          <div className="sq-stat-cell clay-element">
            <span className="sq-stat-value">{Number(serverScore).toFixed(2)}</span>
            <div className="sq-stat-label">Score (pts)</div>
          </div>
        </div>
      </div>

      <div className="sq-card clay-element" style={{ marginTop: '12px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
          Answer review
        </p>
        {serverBreakdown.map((row) => {
          const ok = Number(row.score) > 0
          const skipped = row.selected_option_text === '(skipped)'
          return (
            <div key={row.question_id} className="sq-review-row">
              <span>
                {ok
                  ? <i className="ti ti-check sq-icon-ok" aria-label="Correct" />
                  : <i className="ti ti-x sq-icon-bad" aria-label="Incorrect" />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--sq-text)', lineHeight: 1.4 }}>{row.question_text}</div>
                <div className="sq-muted" style={{ fontSize: '12.5px', marginTop: '2px', marginBottom: 0 }}>
                  Your answer: {row.selected_option_text}
                  {!ok && !skipped && (
                    <> · <span style={{ color: 'var(--sq-success)', fontWeight: 500 }}>Correct: {row.correct_option_text}</span></>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
