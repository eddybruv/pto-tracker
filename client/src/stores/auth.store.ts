import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  departmentId: string | null;
  managerId: string | null;
  hireDate: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    hireDate: string;
    timezone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, tokens, roles } = response.data.data;
        console.log('Login successful:', user);

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        set({ user: { ...user, roles }, isAuthenticated: true, isLoading: false });
      },

      register: async (data) => {
        const response = await api.post('/auth/register', data);
        const { user, tokens, roles } = response.data.data;

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        set({ user: { ...user, roles }, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch {
          // Ignore errors on logout
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user, isLoading: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
