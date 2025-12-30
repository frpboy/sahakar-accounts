import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { UserRole } from '../types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole, canAccess } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have the required role to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredPermission && !canAccess(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}