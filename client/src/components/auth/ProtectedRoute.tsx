import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRoles && user) {
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
