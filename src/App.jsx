import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
import SubmissionsPage from './pages/SubmissionsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/q/:token" element={<StudentQuizPage />} />
        
        {/* Dashboard Routes with Sidebar */}
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
    </BrowserRouter>
  )
}

export default App
