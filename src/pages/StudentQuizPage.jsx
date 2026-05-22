// placeholder
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useParams } from 'react-router-dom'
import {
  ATTEMPT_STORAGE_VERSION,
  addCompletedAttemptToStorage,
  buildCompletedEntryKey,
  clearAttemptStorage,
  clearStudentQuizResultCache,
  loadAttemptFromStorage,
  loadCompletedAttemptSet,
  loadLastCompletedFromStorage,
  loadStudentQuizResultCache,
  saveAttemptToStorage,
  saveLastCompletedToStorage,
  saveStudentQuizResultCache,
} from '../lib/studentQuizAttemptStorage'
import { guestSupabase } from '../lib/guestSupabase'
import { getSupabasePublicConfig, invokeStudentQuizFunction } from '../lib/studentQuizApi'
import './StudentQuizPage.css'
import { BG_IMAGES } from './studentQuiz/constants'
import { StudentConfirmView } from './studentQuiz/ConfirmView'
import { StudentQuizQuestionView } from './studentQuiz/QuestionView'
import { StudentRegisterView } from './studentQuiz/RegisterView'
import { StudentResultsView } from './studentQuiz/ResultsView'
import {
  StudentQuizClosed,
  StudentQuizCompletedNotice,
  StudentQuizLoading,
  StudentQuizNotStarted,
  StudentQuizPaused,
  StudentQuizShell,
  StudentQuizSubmitting,
} from './studentQuiz/ShellScreens'
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
  restoreStudentQuizResultFromCache,
  setCompletedBlocked,
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
  tryAgain,
} from './studentQuiz/store'
import { getElapsedMsForDeadline, getQuestionDurationMs } from './studentQuiz/utils'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function StudentQuizPage() {
  const { token } = useParams()
  const storageKey = useMemo(() => (token ? `quiz-attempt:${token}` : ''), [token])
  const completedStorageKey = useMemo(() => (token ? `quiz-completed:${token}` : ''), [token])
  const [bgImage] = useState(() => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)])
  const session = useSyncExternalStore(subscribeStudentQuiz, getStudentQuizSnapshot, getStudentQuizSnapshot)
  const [gate, setGate] = useState(() => ({ kind: 'loading' }))
  const quizTitle = session.quiz?.title ?? gate.quiz?.title
  useDocumentTitle(quizTitle || 'Quiz')
  const [gateReloadNonce, setGateReloadNonce] = useState(0)
  const hasRestoredRef = useRef(false)
  const answeringRef = useRef(false)

  useEffect(() => { hasRestoredRef.current = false }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    if (session.flowStage === 'result' || gate.kind === 'closed') { clearAttemptStorage(storageKey); return }
    if (session.flowStage !== 'quiz' && session.flowStage !== 'confirm') return
    if (!session.quiz?.id || !session.submissionId || !session.questions.length) return
    const payload = buildAttemptStoragePayload(session.quiz.id)
    if (payload) saveAttemptToStorage(storageKey, { ...payload, version: ATTEMPT_STORAGE_VERSION })
  }, [storageKey, session, gate.kind])

  useEffect(() => {
    ;(async () => {
      if (!token) { setGate({ kind: 'closed' }); return }
      setGate({ kind: 'loading' })
      const { data, error } = await guestSupabase.from('quizzes').select('*, quiz_classes(*)').eq('public_token', token).single()
      if (error || !data) { setGate({ kind: 'closed' }); return }
      const now = Date.now()
      if (now < new Date(data.start_at).getTime()) { setGate({ kind: 'not_started', quiz: data }); return }
      if (now > new Date(data.end_at).getTime()) { setGate({ kind: 'closed' }); return }
      if (data.is_paused) { setGate({ kind: 'paused', quiz: data }); return }
      initQuizLoaded({ token, quiz: data, classes: data.quiz_classes ?? [] })
      const cachedResult = loadStudentQuizResultCache(completedStorageKey)
      if (cachedResult?.quizId === data.id && cachedResult.breakdown.length > 0) {
        restoreStudentQuizResultFromCache({ token, quiz: data, classes: data.quiz_classes ?? [], cache: cachedResult })
      } else {
        const lastCompleted = loadLastCompletedFromStorage(completedStorageKey)
        if (lastCompleted?.quizId === data.id) {
          setRegisterField('fullName', String(lastCompleted.studentName ?? ''))
          setRegisterField('classId', String(lastCompleted.classId ?? ''))
          setCompletedBlocked(`You already completed this quiz${lastCompleted.studentName ? ` as ${lastCompleted.studentName}` : ''}.`)
        }
      }
      setGate({ kind: 'ready' })
    })()
  }, [token, completedStorageKey, gateReloadNonce])

  useEffect(() => {
    if (gate.kind !== 'ready') return
    const snap = getStudentQuizSnapshot()
    if (!snap.quiz?.id || hasRestoredRef.current) return
    if (snap.flowStage === 'completed' || snap.flowStage === 'result') { hasRestoredRef.current = true; return }
    hasRestoredRef.current = true
    const saved = loadAttemptFromStorage(storageKey)
    if (!saved) return
    if (saved.quizId !== snap.quiz.id || !saved.submissionId || !['question', 'review'].includes(saved.stage)) {
      clearAttemptStorage(storageKey); return
    }
    ;(async () => {
      const { data: qRows, error: qErr } = await guestSupabase
        .from('questions').select('*, options(id, option_text, is_correct)').eq('quiz_id', snap.quiz.id).order('order_index')
      if (qErr || !qRows?.length) { clearAttemptStorage(storageKey); return }
      if (saved.stage === 'question' && Array.isArray(saved.answers) && saved.answers.length !== saved.index) { clearAttemptStorage(storageKey); return }
      if (saved.stage === 'review' && Array.isArray(saved.answers) && saved.answers.length !== qRows.length) { clearAttemptStorage(storageKey); return }
      hydrateFromStorage(saved, qRows)
    })()
  }, [gate.kind, storageKey, token, session.quiz?.id])

  const handleRegisterStart = async () => {
    const snap = getStudentQuizSnapshot()
    const name = snap.register.fullName.trim()
    const errs = { name: '', class: '', form: '' }
    if (!name) errs.name = 'Full name is required.'
    if (!snap.register.classId) errs.class = 'Please select a class.'
    if (errs.name || errs.class) { setRegisterErrors(errs); return }
    if (name.length > 100) { setRegisterErrors({ name: 'Name must be at most 100 characters.', class: '', form: '' }); return }
    const localCompletedSet = loadCompletedAttemptSet(completedStorageKey)
    const completedEntryKey = buildCompletedEntryKey({ quizId: snap.quiz.id, classId: snap.register.classId, studentName: name })
    if (localCompletedSet.has(completedEntryKey)) { setCompletedBlocked('You already completed this quiz on this device with this name and class.'); return }
    if (!getSupabasePublicConfig()) { setRegisterErrors({ name: '', class: '', form: 'App is missing Supabase configuration.' }); return }
    setStartingFlag(true)
    try {
      const checkData = await invokeStudentQuizFunction('check-quiz-attempt', {
        quiz_id: snap.quiz.id,
        quiz_class_id: snap.register.classId,
        student_name: name,
      })
      if (checkData.completed) { setCompletedBlocked('You already completed this quiz with this name and class.'); setStartingFlag(false); return }
    } catch (e) {
      setRegisterErrors({ name: e instanceof Error ? e.message : 'Could not verify attempt status.', class: '', form: '' })
      setStartingFlag(false)
      return
    }
    clearAttemptStorage(storageKey)
    clearStudentQuizResultCache(completedStorageKey)
    let submissionId
    try {
      const startData = await invokeStudentQuizFunction('start-quiz-attempt', {
        quiz_id: snap.quiz.id,
        quiz_class_id: snap.register.classId,
        student_name: name,
      })
      submissionId = startData.submission_id
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not start quiz.'
      if (msg.toLowerCase().includes('already completed')) {
        setCompletedBlocked(msg)
        setStartingFlag(false)
        return
      }
      setRegisterErrors({ name: msg, class: '', form: '' })
      setStartingFlag(false)
      return
    }
    if (!submissionId) {
      setRegisterErrors({ name: 'Could not start quiz.', class: '', form: '' })
      setStartingFlag(false)
      return
    }
    const { data: qRows, error: qErr } = await guestSupabase
      .from('questions').select('*, options(id, option_text, is_correct)').eq('quiz_id', snap.quiz.id).order('order_index')
    if (qErr || !qRows?.length) {
      setRegisterErrors({ name: 'This quiz has no questions yet.', class: '', form: '' })
      setStartingFlag(false)
      return
    }
    quizStarted({ submissionId, questions: qRows })
  }

  const handleDeadlineSet = useCallback((ms) => { setQuestionDeadline(ms) }, [])

  const handleQuestionTimeout = useCallback(() => {
    if (answeringRef.current) return
    const snap = getStudentQuizSnapshot()
    if (snap.flowStage !== 'quiz') return
    answeringRef.current = true
    const q = snap.questions[snap.quizIndex]
    const skipElapsedMs = q ? getQuestionDurationMs(q) : 30_000
    try { commitAnswerForCurrentQuestion({ selection: { kind: 'skip' }, elapsedMs: skipElapsedMs }); clearQuestionDeadline() }
    finally { answeringRef.current = false }
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

  const handleConfirmSubmit = async () => {
    const snap = getStudentQuizSnapshot()
    setConfirmErrors({ retype: '', submit: '' }); setSubmitError('')
    const registered = snap.register.fullName.trim()
    if (snap.confirmRetypeName.trim().toLowerCase() !== registered.toLowerCase() || !registered) {
      setConfirmErrors({ retype: 'Name must match (case-insensitive).', submit: '' }); return
    }
    if (!getSupabasePublicConfig()) { setSubmitError('App is missing Supabase configuration.'); return }
    setSubmittingFlag(true)
    try {
      const data = await invokeStudentQuizFunction('submit-quiz', {
        submission_id: snap.submissionId,
        answers: answersToSubmitPayload(),
        student_name: registered,
        quiz_class_id: snap.register.classId,
      })
      if (snap.quiz?.id && snap.register.classId && registered) {
        saveLastCompletedToStorage(completedStorageKey, { quizId: snap.quiz.id, classId: snap.register.classId, studentName: registered, completedAt: Date.now() })
        addCompletedAttemptToStorage(completedStorageKey, { quizId: snap.quiz.id, classId: snap.register.classId, studentName: registered })
        saveStudentQuizResultCache(completedStorageKey, {
          quizId: snap.quiz.id,
          serverScore: Number(data.total_score ?? 0),
          breakdown: data.breakdown ?? [],
          answers: snap.answers.map((a) => ({ ...a })),
          register: { fullName: registered, classId: snap.register.classId },
        })
      }
      clearAttemptStorage(storageKey)
      setResultFromServer({ finalScore: Number(data.total_score ?? 0), breakdown: data.breakdown ?? [] })
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed.'); setSubmittingFlag(false)
    }
  }

  if (gate.kind === 'loading') return <StudentQuizShell backgroundImage={bgImage} centerContent><StudentQuizLoading /></StudentQuizShell>
  if (gate.kind === 'closed') return <StudentQuizShell backgroundImage={bgImage} centerContent><StudentQuizClosed title="Quiz" /></StudentQuizShell>
  if (gate.kind === 'not_started') {
    const q = gate.quiz
    const startMs = new Date(q.start_at).getTime()
    return (
      <StudentQuizShell backgroundImage={bgImage} centerContent>
        <StudentQuizNotStarted
          title={q.title}
          startAt={new Date(q.start_at).toLocaleString()}
          startAtMs={startMs}
          onReachedStart={() => setGateReloadNonce((v) => v + 1)}
        />
      </StudentQuizShell>
    )
  }
  if (gate.kind === 'paused') return <StudentQuizShell backgroundImage={bgImage} centerContent><StudentQuizPaused title={gate.quiz?.title} /></StudentQuizShell>
  if (session.flowStage === 'completed') return <StudentQuizShell backgroundImage={bgImage} centerContent><StudentQuizCompletedNotice title={session.quiz?.title} completedNotice={session.completedNotice} /></StudentQuizShell>
  if (gate.kind === 'ready') {
    if (session.flowStage === 'register') return <StudentQuizShell backgroundImage={bgImage}><StudentRegisterView snapshot={session} onFieldChange={(f, v) => setRegisterField(f, v)} onStart={handleRegisterStart} /></StudentQuizShell>
    if (session.flowStage === 'quiz') {
      if (session.isSubmitting) return <StudentQuizShell backgroundImage={bgImage}><StudentQuizSubmitting /></StudentQuizShell>
      return <StudentQuizShell backgroundImage={bgImage}><StudentQuizQuestionView snapshot={session} onDeadlineSet={handleDeadlineSet} onTimeout={handleQuestionTimeout} onSubmitAnswer={handleSubmitAnswer} /></StudentQuizShell>
    }
    if (session.flowStage === 'confirm') return <StudentQuizShell backgroundImage={bgImage}><StudentConfirmView snapshot={session} onRetypeChange={(v) => setConfirmRetypeName(v)} onReview={() => goReviewAnswers()} onSubmit={handleConfirmSubmit} submitError={session.submitError} /></StudentQuizShell>
    if (session.flowStage === 'result') return <StudentQuizShell backgroundImage={bgImage}><StudentResultsView snapshot={session} /></StudentQuizShell>
  }
  return <StudentQuizShell backgroundImage={bgImage}><StudentQuizLoading /></StudentQuizShell>
}