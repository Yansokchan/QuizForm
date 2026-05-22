import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './pages/Dashboard'
import QuizzesPage from './pages/QuizzesPage'
import ClassesPage from './pages/ClassesPage'
import LandingPage from './pages/LandingPageView'
import LoginPage from './pages/LoginPage'
import QuizEditor from './pages/QuizEditor'
import ResultsPage from './pages/ResultsPage'
import StudentQuizPage from './pages/StudentQuizPage'
import StudentDemoQuizPage from './pages/StudentDemoQuizPage'
import SubmissionsPage from './pages/SubmissionsPage'
import { AuthLoginDialogProvider, useAuthLoginDialog } from './contexts/AuthLoginDialogContext'
import RouteTitle from './components/RouteTitle'

function SignInQueryHandler() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openLogin } = useAuthLoginDialog()

  useEffect(() => {
    if (searchParams.get('signin') !== '1') return
    openLogin()
    const next = new URLSearchParams(searchParams)
    next.delete('signin')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, openLogin])

  return null
}

function AppRoutes() {
  return (
    <>
      <RouteTitle />
      <SignInQueryHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/demo" element={<StudentDemoQuizPage />} />
        <Route path="/q/:token" element={<StudentQuizPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="quizzes" element={<QuizzesPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="classes" element={<ClassesPage />} />

          <Route path="quiz/create" element={<QuizEditor />} />
          <Route path="quiz/:id" element={<QuizEditor />} />
          <Route path="quiz/:id/results" element={<ResultsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthLoginDialogProvider>
        <AppRoutes />
      </AuthLoginDialogProvider>
    </BrowserRouter>
  )
}

export default App
