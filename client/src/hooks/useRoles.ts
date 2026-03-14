import { useAuthStore } from '@/stores/auth.store';
import type { Role } from '@/types';

export function useRoles() {
  const user = useAuthStore((s) => s.user);
  const roles = (user?.roles ?? []) as Role[];

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isTechLead: roles.includes('tech_lead'),
    isDeveloper: roles.includes('developer'),
    isManager: roles.includes('admin') || roles.includes('tech_lead'),
    hasRole: (role: Role) => roles.includes(role),
    hasAnyRole: (...r: Role[]) => r.some((role) => roles.includes(role)),
  };
}
