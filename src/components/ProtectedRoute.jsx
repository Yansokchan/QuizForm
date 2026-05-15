import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="container" style={{ padding: '2rem 0' }}>Loading session...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
