import { Navigate } from 'react-router-dom'

/** Legacy /login URL — opens sign-in on the landing page. */
export default function LoginPage() {
  return <Navigate to="/?signin=1" replace />
}
