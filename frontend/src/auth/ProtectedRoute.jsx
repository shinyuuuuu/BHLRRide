import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth.js'

// think of this as the security guard. works well with app.jsx.
// security for this happens for the pages in the browser ONLY. actual security happens didto sa laravel backend.

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()
 
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/browse" replace />
  }
  return children
}
 
export default ProtectedRoute