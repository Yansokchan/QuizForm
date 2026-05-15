import QuizButton from '../../components/ui/QuizButton'
import { LogoBadge } from './ShellScreens'

export function StudentRegisterView({ snapshot, onFieldChange, onStart }) {
  const { quiz, classes, register, isStarting } = snapshot
  const { fullName, classId, errors } = register

  return (
    <div className="sq-step-enter ">
      <LogoBadge />
      <div className="sq-card clay-element">
        <h1 className="sq-title">{quiz?.title ?? 'Quiz'}</h1>
        <p className="sq-subtitle">Enter your details to get started. Make sure your name matches your enrollment records.</p>

        <hr className="sq-divider" />

        <div className="sq-form-group">
          <label className="sq-label" htmlFor="sq-full-name">Full name</label>
          <input
            id="sq-full-name"
            className="sq-input"
            autoComplete="name"
            placeholder="e.g. Sophea Chantha"
            value={fullName}
            disabled={isStarting}
            onChange={(e) => onFieldChange('fullName', e.target.value)}
          />
          {errors.name && <p className="sq-error">{errors.name}</p>}
        </div>

        <div className="sq-form-group">
          <label className="sq-label" htmlFor="sq-class">Class</label>
          <select
            id="sq-class"
            className="sq-select"
            value={classId}
            disabled={isStarting}
            onChange={(e) => onFieldChange('classId', e.target.value)}
          >
            <option value="">- Select your class -</option>
            {(classes ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
          {errors.class && <p className="sq-error">{errors.class}</p>}
        </div>

        {errors.form && <p className="sq-error">{errors.form}</p>}

        {!classes?.length && (
          <p className="sq-error" style={{ marginTop: '0.5rem' }}>
            No classes are set up for this quiz yet. Ask your teacher to add classes before you can start.
          </p>
        )}

        <div className="sq-row-actions">
          <QuizButton
            icon="play"
            onClick={onStart}
            disabled={!classes?.length}
            loading={isStarting}
            loadingLabel="Starting..."
          >
            Start quiz
          </QuizButton>
        </div>
      </div>
      <p style={{ marginTop: '0.85rem', fontSize: '12px', color: 'var(--sq-text-hint)', textAlign: 'center' }}>
        {(snapshot.questions?.length || 5)} questions - 30 seconds each
      </p>
    </div>
  )
}
