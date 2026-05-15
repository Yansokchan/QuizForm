import { isMultiSelectQuestion } from '../../lib/questionTypes'
import { QUESTION_DURATION_MS } from './constants'
import { getQuestionDurationMs, normalizeOptionId, normalizeOptionIdList } from './utils'

function createEmptySession() {
  return {
    flowStage: 'idle',
    token: '',
    quiz: null,
    classes: [],
    questions: [],
    submissionId: null,
    register: {
      fullName: '',
      classId: '',
      errors: { name: '', class: '', form: '' },
    },
    quizIndex: 0,
    answers: [],
    isReviewingAnswers: false,
    questionDeadlineAt: null,
    questionLocked: false,
    confirmRetypeName: '',
    confirmErrors: { retype: '', submit: '' },
    completedNotice: '',
    serverScore: 0,
    serverBreakdown: [],
    submitError: '',
    isSubmitting: false,
    isStarting: false,
    nowTick: Date.now(),
  }
}

let state = createEmptySession()
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      // ignore subscriber errors
    }
  })
}

export function getStudentQuizSnapshot() {
  return state
}

export function subscribeStudentQuiz(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setState(partial) {
  state = { ...state, ...partial }
  emit()
}

function replaceState(next) {
  state = next
  emit()
}

export function initQuizLoaded({ token, quiz, classes }) {
  replaceState({ ...createEmptySession(), flowStage: 'register', token, quiz, classes: classes ?? [], nowTick: Date.now() })
}

export function setRegisterField(field, value) {
  if (field !== 'fullName' && field !== 'classId') return
  setState({ register: { ...state.register, [field]: value, errors: { name: '', class: '', form: '' } } })
}

export function setRegisterErrors(errors) {
  setState({ register: { ...state.register, errors: { ...state.register.errors, ...errors } } })
}

export function setCompletedBlocked(completedNotice) {
  replaceState({ ...state, flowStage: 'completed', completedNotice })
}

export function quizStarted({ submissionId, questions }) {
  replaceState({
    ...state,
    flowStage: 'quiz',
    submissionId,
    questions,
    quizIndex: 0,
    answers: [],
    isReviewingAnswers: false,
    questionDeadlineAt: null,
    questionLocked: false,
    confirmRetypeName: '',
    confirmErrors: { retype: '', submit: '' },
    submitError: '',
    isSubmitting: false,
    isStarting: false,
  })
}

export function setStartingFlag(isStarting) {
  setState({ isStarting })
}

export function setQuestionDeadline(deadlineMs) {
  setState({ questionDeadlineAt: deadlineMs })
}

export function clearQuestionDeadline() {
  setState({ questionDeadlineAt: null })
}

export function setSubmittingFlag(isSubmitting) {
  setState({ isSubmitting })
}

function multiSelectionIds(selection) {
  if (!selection) return []
  if (selection.kind === 'multi' && selection.optionIds != null) {
    const raw = selection.optionIds
    let arr = []
    if (Array.isArray(raw)) arr = [...raw]
    else {
      try {
        arr = Array.from(raw)
      } catch {
        arr = []
      }
    }
    return normalizeOptionIdList(arr)
  }
  if (selection.kind === 'single') {
    const id = normalizeOptionId(selection.optionId)
    return id ? [id] : []
  }
  return []
}

export function commitAnswerForCurrentQuestion({ selection, elapsedMs }) {
  const q = state.questions[state.quizIndex]
  if (!q) return
  const durationMs = getQuestionDurationMs(q)
  const timeLimitSec = Math.max(1, Math.round(durationMs / 1000))
  const cappedMs = Math.min(durationMs, Math.max(0, elapsedMs))
  const timeTaken = Math.min(timeLimitSec, Math.max(0, Math.round(cappedMs / 1000)))
  const multi = isMultiSelectQuestion(q)
  let row
  if (!selection || selection.kind === 'skip') {
    row = { question_id: q.id, selected_option_id: null, selected_option_ids: null, time_taken: timeTaken, elapsedMs: cappedMs }
  } else if (multi) {
    const ids = multiSelectionIds(selection)
    row = ids.length === 0
      ? { question_id: q.id, selected_option_id: null, selected_option_ids: null, time_taken: timeTaken, elapsedMs: cappedMs }
      : { question_id: q.id, selected_option_id: null, selected_option_ids: ids, time_taken: timeTaken, elapsedMs: cappedMs }
  } else {
    const oid = selection.kind === 'single' ? normalizeOptionId(selection.optionId) || null : null
    row = { question_id: q.id, selected_option_id: oid, selected_option_ids: null, time_taken: timeTaken, elapsedMs: cappedMs }
  }
  const answers = [...state.answers]
  if (state.isReviewingAnswers) {
    answers[state.quizIndex] = row
    const last = state.quizIndex >= state.questions.length - 1
    if (last) {
      replaceState({ ...state, answers, flowStage: 'confirm', quizIndex: 0, questionDeadlineAt: null, questionLocked: false, isReviewingAnswers: false, confirmRetypeName: '', confirmErrors: { retype: '', submit: '' } })
    } else {
      replaceState({ ...state, answers, quizIndex: state.quizIndex + 1, questionDeadlineAt: null, questionLocked: false, isReviewingAnswers: true })
    }
    return
  }
  answers.push(row)
  const last = state.quizIndex >= state.questions.length - 1
  if (last) {
    replaceState({ ...state, answers, flowStage: 'confirm', quizIndex: 0, questionDeadlineAt: null, questionLocked: false, isReviewingAnswers: false, confirmRetypeName: '', confirmErrors: { retype: '', submit: '' } })
  } else {
    replaceState({ ...state, answers, quizIndex: state.quizIndex + 1, questionDeadlineAt: null, questionLocked: false })
  }
}

export function goReviewAnswers() {
  replaceState({ ...state, flowStage: 'quiz', quizIndex: 0, questionDeadlineAt: null, questionLocked: false, isReviewingAnswers: true, confirmRetypeName: '', confirmErrors: { retype: '', submit: '' } })
}

export function setConfirmRetypeName(value) {
  setState({ confirmRetypeName: value, confirmErrors: { ...state.confirmErrors, retype: '' } })
}

export function setConfirmErrors(confirmErrors) {
  setState({ confirmErrors: { ...state.confirmErrors, ...confirmErrors } })
}

export function setSubmitError(submitError) {
  setState({ submitError })
}

export function setResultFromServer({ finalScore, breakdown }) {
  replaceState({ ...state, flowStage: 'result', serverScore: finalScore, serverBreakdown: breakdown ?? [], submitError: '', isSubmitting: false, isStarting: false, questionLocked: false, questionDeadlineAt: null })
}

export function tryAgain() {
  replaceState({ ...createEmptySession(), token: state.token, quiz: state.quiz, classes: state.classes, flowStage: 'register', nowTick: Date.now() })
}

function normalizeStoredAnswerRow(row, questions) {
  if (!row || typeof row !== 'object') return row
  const q = Array.isArray(questions) ? questions.find((x) => x.id === row.question_id) : null
  const capMs = q ? getQuestionDurationMs(q) : QUESTION_DURATION_MS
  const elapsedMs =
    typeof row.elapsedMs === 'number' ? row.elapsedMs : Math.min(capMs, Math.max(0, Number(row.time_taken ?? 0) * 1000))
  return { ...row, elapsedMs }
}

export function restoreStudentQuizResultFromCache({ token, quiz, classes, cache }) {
  const register = {
    fullName: String(cache.register?.fullName ?? ''),
    classId: String(cache.register?.classId ?? ''),
    errors: { name: '', class: '', form: '' },
  }
  const answers = Array.isArray(cache.answers) ? cache.answers.map((r) => normalizeStoredAnswerRow(r, null)) : []
  replaceState({
    ...createEmptySession(),
    token,
    quiz,
    classes: classes ?? [],
    flowStage: 'result',
    register,
    answers,
    serverScore: Number(cache.serverScore ?? 0),
    serverBreakdown: Array.isArray(cache.breakdown) ? cache.breakdown : [],
    nowTick: Date.now(),
  })
}

export function hydrateFromStorage(saved, questionsWithOptions) {
  if (!saved || !questionsWithOptions?.length) return false
  const restoredIndex = Number.isInteger(saved.index) ? saved.index : 0
  const boundedIndex = Math.max(0, Math.min(restoredIndex, questionsWithOptions.length - 1))
  const restoredAnswers = Array.isArray(saved.answers) ? saved.answers.map((r) => normalizeStoredAnswerRow(r, questionsWithOptions)) : []
  const entry = saved.entry && typeof saved.entry === 'object' ? saved.entry : { student_name: '', quiz_class_id: '' }
  const storageStage = saved.stage === 'review' ? 'confirm' : saved.stage === 'question' ? 'quiz' : 'register'
  replaceState({
    ...state,
    questions: questionsWithOptions,
    submissionId: saved.submissionId,
    register: { fullName: String(entry.student_name ?? ''), classId: String(entry.quiz_class_id ?? ''), errors: { name: '', class: '', form: '' } },
    answers: restoredAnswers,
    quizIndex: storageStage === 'confirm' ? 0 : boundedIndex,
    flowStage: storageStage,
    questionDeadlineAt: typeof saved.questionDeadlineAt === 'number' ? saved.questionDeadlineAt : null,
    questionLocked: false,
    isReviewingAnswers: false,
    confirmRetypeName: typeof saved.confirmRetypeName === 'string' ? saved.confirmRetypeName : '',
    confirmErrors: { retype: '', submit: '' },
    isSubmitting: false,
    isStarting: false,
  })
  return true
}

export function buildAttemptStoragePayload(quizId) {
  if (state.flowStage !== 'quiz' && state.flowStage !== 'confirm') return null
  return {
    version: 1,
    quizId,
    stage: state.flowStage === 'confirm' ? 'review' : 'question',
    entry: { student_name: state.register.fullName, quiz_class_id: state.register.classId },
    submissionId: state.submissionId,
    index: state.quizIndex,
    answers: state.answers,
    questionDeadlineAt: state.questionDeadlineAt,
    confirmRetypeName: state.confirmRetypeName,
    savedAt: Date.now(),
  }
}

function collectRawOptionValues(a) {
  const vals = []
  let raw = a?.selected_option_ids
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      raw = null
    }
  }
  if (Array.isArray(raw)) {
    vals.push(...raw)
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    vals.push(...Object.values(raw))
  }
  if (a?.selected_option_id != null && a.selected_option_id !== '') {
    vals.push(a.selected_option_id)
  }
  return vals
}

function coalesceSelectedOptionIdsFromRow(a) {
  return normalizeOptionIdList(collectRawOptionValues(a))
}

export function answersToSubmitPayload() {
  return state.answers.map((a) => {
    const qid = String(a.question_id)
    const question = state.questions.find((q) => String(q.id) === qid)
    const ids = coalesceSelectedOptionIdsFromRow(a)
    if (ids.length === 0) {
      return { question_id: qid, selected_option_id: null, selected_option_ids: null, time_taken: a.time_taken }
    }
    if (question && isMultiSelectQuestion(question)) {
      return {
        question_id: qid,
        time_taken: a.time_taken,
        selected_option_id: ids[0] ?? null,
        selected_option_ids: [...ids],
      }
    }
    return { question_id: qid, selected_option_id: ids[0], selected_option_ids: null, time_taken: a.time_taken }
  })
}
