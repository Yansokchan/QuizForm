import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import QuizButton from '../../components/ui/QuizButton'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { cn } from '../../lib/utils'
import { LogoBadge } from './ShellScreens'

export function StudentRegisterView({ snapshot, onFieldChange, onStart, demoMode = false, questionCount }) {
  const { quiz, classes, register, isStarting } = snapshot
  const { fullName, classId, errors } = register
  const nQuestions = questionCount ?? snapshot.questions?.length ?? 5
  const classList = classes ?? []

  const selectedClass = useMemo(
    () => classList.find((c) => c.id === classId),
    [classList, classId],
  )

  const classTriggerLabel = selectedClass?.class_name ?? 'Select your class'

  return (
    <div className="sq-step-enter ">
      <LogoBadge />
      <div className="sq-card clay-element">
        <h1 className="sq-title">{quiz?.title ?? 'Quiz'}</h1>
        {demoMode ? (
          <p className="sq-subtitle">Demo only — enter a name and pick Demo class to try the quiz.</p>
        ) : (
          <p className="sq-subtitle">Enter your details to get started. Make sure your name matches your enrollment records.</p>
        )}

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
          <div className="sq-class-dropdown">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isStarting || !classList.length}>
                <Button
                  id="sq-class"
                  type="button"
                  variant="outline"
                  className={cn(
                    'sq-class-trigger !w-full min-w-0 shrink !justify-between !rounded-[var(--sq-radius-sm)] !border-[0.5px] !border-[var(--sq-border)] !bg-[var(--sq-surface-alt)] !text-[15px] !font-normal !shadow-none',
                    'dark:!border-[var(--sq-border)] dark:!bg-[var(--sq-surface-alt)] dark:!text-[var(--sq-text)] dark:hover:!bg-[var(--sq-surface-alt)] dark:aria-expanded:!bg-[var(--sq-surface)]',
                    !classId && '!text-[var(--sq-text-hint)] dark:!text-[var(--sq-text-hint)]',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-left">{classTriggerLabel}</span>
                  <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="sq-class-menu rounded-[8px] max-h-[300px] overflow-y-auto w-[var(--anchor-width)] min-w-[var(--anchor-width)]"
              >
              {classList.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => onFieldChange('classId', c.id)}
                  className="rounded-[6px]"
                >
                  {c.class_name}
                </DropdownMenuItem>
              ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
        {nQuestions} questions - 30 seconds each
      </p>
    </div>
  )
}
