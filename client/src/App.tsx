import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { RequestsPage } from '@/features/requests/RequestsPage';
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { BalanceHistoryPage } from '@/features/balances/BalanceHistoryPage';
import { UsersPage } from '@/features/admin/UsersPage';
import { PoliciesPage } from '@/features/admin/PoliciesPage';
import { HolidaysPage } from '@/features/admin/HolidaysPage';
import { PtoTypesPage } from '@/features/admin/PtoTypesPage';
import { ProfilePage } from '@/features/profile/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/approvals" element={
              <ProtectedRoute requiredRoles={['tech_lead', 'admin']}>
                <ApprovalsPage />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/balances" element={<BalanceHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/policies" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <PoliciesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/holidays" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <HolidaysPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/pto-types" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <PtoTypesPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
