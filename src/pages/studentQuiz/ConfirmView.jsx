import QuizButton from '../../components/ui/QuizButton'
import { formatElapsedMs, totalElapsedMsFromAnswers } from './utils'

export function StudentConfirmView({ snapshot, onRetypeChange, onReview, onSubmit, submitError }) {
  const { register, questions, answers, confirmRetypeName, confirmErrors, isSubmitting } = snapshot
  const cls = snapshot.classes.find((c) => c.id === register.classId)
  const classLabel = cls?.class_name ?? '-'
  const totalMs = totalElapsedMsFromAnswers(answers)
  const registered = register.fullName.trim()
  const retypeOk = confirmRetypeName.trim().toLowerCase() === registered.toLowerCase() && registered.length > 0

  return (
    <div className="sq-step-enter">
      <div className="sq-logo-badge clay-element flex items-center gap-2">
        <i className="ti ti-clipboard-check" aria-hidden="true" />
        Review &amp; submit
      </div>

      <div className="sq-card clay-element">
        <h1 className="sq-title">Confirm your details</h1>
        <p className="sq-subtitle">Please verify your information before submitting. You cannot change answers after submission.</p>

        <hr className="sq-divider" />

        <div className="sq-confirm-rows">
          <div className="sq-confirm-row">
            <i className="ti ti-user" aria-hidden="true" />
            <span className="sq-confirm-row-label">Full name</span>
            <span className="sq-confirm-row-val">{registered || '-'}</span>
          </div>
          <div className="sq-confirm-row">
            <i className="ti ti-school" aria-hidden="true" />
            <span className="sq-confirm-row-label">Class</span>
            <span className="sq-confirm-row-val">{classLabel}</span>
          </div>
          <div className="sq-confirm-row">
            <i className="ti ti-list-check" aria-hidden="true" />
            <span className="sq-confirm-row-label">Questions answered</span>
            <span className="sq-confirm-row-val">{answers.length} / {questions.length}</span>
          </div>
          <div className="sq-confirm-row">
            <i className="ti ti-clock" aria-hidden="true" />
            <span className="sq-confirm-row-label">Time taken</span>
            <span className="sq-confirm-row-val">{formatElapsedMs(totalMs)}</span>
          </div>
        </div>

        <hr className="sq-divider" />

        <div className="sq-form-group">
          <label className="sq-label" htmlFor="sq-retype">Confirm your full name to submit</label>
          <input
            id="sq-retype"
            className="sq-input"
            autoComplete="off"
            placeholder="Type your full name exactly"
            value={confirmRetypeName}
            disabled={isSubmitting}
            onChange={(e) => onRetypeChange(e.target.value)}
          />
          {confirmErrors.retype && <p className="sq-error">{confirmErrors.retype}</p>}
          {submitError && <p className="sq-error">{submitError}</p>}
        </div>

        <div className="sq-row-actions">
          <QuizButton
            icon="send"
            onClick={onSubmit}
            disabled={!retypeOk}
            loading={isSubmitting}
            loadingLabel="Submitting..."
          >
            Submit quiz
          </QuizButton>
        </div>
      </div>
    </div>
  )
}
