import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  ATTEMPT_STORAGE_VERSION,
  clearAttemptStorage,
  loadAttemptFromStorage,
  saveAttemptToStorage,
} from '../lib/studentQuizAttemptStorage'
import { scoreQuizAnswers } from '../lib/quizScoring'
import {
  DEMO_CLASSES,
  DEMO_QUESTIONS,
  DEMO_QUIZ,
  DEMO_QUIZ_ID,
  DEMO_SUBMISSION_ID,
  DEMO_TOKEN,
} from '../data/demoQuiz'
import './StudentQuizPage.css'
import { BG_IMAGES } from './studentQuiz/constants'
import { StudentConfirmView } from './studentQuiz/ConfirmView'
import { StudentQuizQuestionView } from './studentQuiz/QuestionView'
import { StudentRegisterView } from './studentQuiz/RegisterView'
import { StudentResultsView } from './studentQuiz/ResultsView'
import { StudentQuizShell, StudentQuizSubmitting } from './studentQuiz/ShellScreens'
import {
  answersToSubmitPayload,
  buildAttemptStoragePayload,
  clearQuestionDeadline,
  commitAnswerForCurrentQuestion,
  getStudentQuizSnapshot,
  goReviewAnswers,
  hydrateFromStorage,
  initQuizLoaded,
  quizStarted,
  setConfirmErrors,
  setConfirmRetypeName,
  setQuestionDeadline,
  setRegisterErrors,
  setRegisterField,
  setResultFromServer,
  setSubmitError,
  setStartingFlag,
  setSubmittingFlag,
  subscribeStudentQuiz,
} from './studentQuiz/store'
import { getElapsedMsForDeadline, getQuestionDurationMs } from './studentQuiz/utils'

const STORAGE_KEY = `quiz-attempt:${DEMO_TOKEN}`

export default function StudentDemoQuizPage() {
  const [bgImage] = useState(() => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)])
  const session = useSyncExternalStore(subscribeStudentQuiz, getStudentQuizSnapshot, getStudentQuizSnapshot)
  const [ready, setReady] = useState(false)
  const hasRestoredRef = useRef(false)
  const answeringRef = useRef(false)

  useEffect(() => {
    initQuizLoaded({ token: DEMO_TOKEN, quiz: DEMO_QUIZ, classes: DEMO_CLASSES })
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (session.flowStage === 'result') {
      clearAttemptStorage(STORAGE_KEY)
      return
    }
    if (session.flowStage !== 'quiz' && session.flowStage !== 'confirm') return
    if (!session.quiz?.id || !session.submissionId || !session.questions.length) return
    const payload = buildAttemptStoragePayload(session.quiz.id)
    if (payload) saveAttemptToStorage(STORAGE_KEY, { ...payload, version: ATTEMPT_STORAGE_VERSION })
  }, [ready, session])

  useEffect(() => {
    if (!ready) return
    const snap = getStudentQuizSnapshot()
    if (!snap.quiz?.id || hasRestoredRef.current) return
    if (snap.flowStage === 'result') {
      hasRestoredRef.current = true
      return
    }
    hasRestoredRef.current = true
    const saved = loadAttemptFromStorage(STORAGE_KEY)
    if (!saved) return
    if (saved.quizId !== DEMO_QUIZ_ID || !saved.submissionId || !['question', 'review'].includes(saved.stage)) {
      clearAttemptStorage(STORAGE_KEY)
      return
    }
    if (saved.stage === 'question' && Array.isArray(saved.answers) && saved.answers.length !== saved.index) {
      clearAttemptStorage(STORAGE_KEY)
      return
    }
    if (saved.stage === 'review' && Array.isArray(saved.answers) && saved.answers.length !== DEMO_QUESTIONS.length) {
      clearAttemptStorage(STORAGE_KEY)
      return
    }
    hydrateFromStorage(saved, DEMO_QUESTIONS)
  }, [ready, session.quiz?.id, session.flowStage])

  const handleRegisterStart = useCallback(() => {
    const snap = getStudentQuizSnapshot()
    const name = snap.register.fullName.trim()
    const errs = { name: '', class: '', form: '' }
    if (!name) errs.name = 'Full name is required.'
    if (!snap.register.classId) errs.class = 'Please select a class.'
    if (errs.name || errs.class) {
      setRegisterErrors(errs)
      return
    }
    if (name.length > 100) {
      setRegisterErrors({ name: 'Name must be at most 100 characters.', class: '', form: '' })
      return
    }
    setStartingFlag(true)
    clearAttemptStorage(STORAGE_KEY)
    quizStarted({ submissionId: DEMO_SUBMISSION_ID, questions: DEMO_QUESTIONS })
  }, [])

  const handleDeadlineSet = useCallback((ms) => {
    setQuestionDeadline(ms)
  }, [])

  const handleQuestionTimeout = useCallback(() => {
    if (answeringRef.current) return
    const snap = getStudentQuizSnapshot()
    if (snap.flowStage !== 'quiz') return
    answeringRef.current = true
    const q = snap.questions[snap.quizIndex]
    const skipElapsedMs = q ? getQuestionDurationMs(q) : 30_000
    try {
      commitAnswerForCurrentQuestion({ selection: { kind: 'skip' }, elapsedMs: skipElapsedMs })
      clearQuestionDeadline()
    } finally {
      answeringRef.current = false
    }
  }, [])

  const handleSubmitAnswer = useCallback((selection) => {
    if (answeringRef.current) return
    answeringRef.current = true
    try {
      const snap = getStudentQuizSnapshot()
      if (snap.flowStage !== 'quiz') return
      const q = snap.questions[snap.quizIndex]
      const elapsedMs = getElapsedMsForDeadline(snap.questionDeadlineAt, q)
      clearQuestionDeadline()
      commitAnswerForCurrentQuestion({ selection, elapsedMs })
    } finally {
      answeringRef.current = false
    }
  }, [])

  const handleConfirmSubmit = useCallback(() => {
    const snap = getStudentQuizSnapshot()
    setConfirmErrors({ retype: '', submit: '' })
    setSubmitError('')
    const registered = snap.register.fullName.trim()
    if (snap.confirmRetypeName.trim().toLowerCase() !== registered.toLowerCase() || !registered) {
      setConfirmErrors({ retype: 'Name must match (case-insensitive).', submit: '' })
      return
    }
    setSubmittingFlag(true)
    try {
      const payload = answersToSubmitPayload()
      const { total_score, breakdown } = scoreQuizAnswers(snap.questions, payload)
      clearAttemptStorage(STORAGE_KEY)
      setResultFromServer({ finalScore: total_score, breakdown })
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not score quiz.')
      setSubmittingFlag(false)
    }
  }, [])

  if (!ready) {
    return (
      <StudentQuizShell backgroundImage={bgImage} centerContent>
        <p className="sq-subtitle">Loading demo…</p>
      </StudentQuizShell>
    )
  }

  if (session.flowStage === 'register') {
    return (
      <StudentQuizShell backgroundImage={bgImage}>
        <StudentRegisterView
          demoMode
          questionCount={DEMO_QUESTIONS.length}
          snapshot={session}
          onFieldChange={(f, v) => setRegisterField(f, v)}
          onStart={handleRegisterStart}
        />
      </StudentQuizShell>
    )
  }

  if (session.flowStage === 'quiz') {
    if (session.isSubmitting) {
      return (
        <StudentQuizShell backgroundImage={bgImage}>
          <StudentQuizSubmitting />
        </StudentQuizShell>
      )
    }
    return (
      <StudentQuizShell backgroundImage={bgImage}>
        <StudentQuizQuestionView
          snapshot={session}
          onDeadlineSet={handleDeadlineSet}
          onTimeout={handleQuestionTimeout}
          onSubmitAnswer={handleSubmitAnswer}
        />
      </StudentQuizShell>
    )
  }

  if (session.flowStage === 'confirm') {
    return (
      <StudentQuizShell backgroundImage={bgImage}>
        <StudentConfirmView
          snapshot={session}
          onRetypeChange={(v) => setConfirmRetypeName(v)}
          onReview={() => goReviewAnswers()}
          onSubmit={handleConfirmSubmit}
          submitError={session.submitError}
        />
      </StudentQuizShell>
    )
  }

  if (session.flowStage === 'result') {
    return (
      <StudentQuizShell backgroundImage={bgImage}>
        <StudentResultsView snapshot={session} />
      </StudentQuizShell>
    )
  }

  return (
    <StudentQuizShell backgroundImage={bgImage} centerContent>
      <p className="sq-subtitle">Loading demo…</p>
    </StudentQuizShell>
  )
}
