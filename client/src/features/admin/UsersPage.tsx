import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { cn, capitalizeFirst } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { User } from '@/types';

const roleBadge: Record<string, 'amber' | 'ocean' | 'violet'> = {
  admin: 'amber',
  tech_lead: 'ocean',
  developer: 'violet',
};

export function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return (res.data.data ?? res.data) as User[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast({ type: 'success', message: 'User deactivated' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to deactivate user' });
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage team members and their roles</p>
        </div>
        <Button onClick={() => { setEditUser(null); setShowForm(true); }} icon={<Plus className="h-4 w-4" />}>
          Add User
        </Button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !users || users.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No users" description="Add team members to get started" />
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user, idx) => (
            <Card
              key={user.id}
              hover
              padding="none"
              className={cn('animate-fade-in opacity-0', `stagger-${Math.min(idx + 1, 5)}`)}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar firstName={user.firstName} lastName={user.lastName} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5">
                    {(user.roles ?? []).map((role) => (
                      <Badge key={role} variant={roleBadge[role] ?? 'slate'}>
                        {capitalizeFirst(role.replace('_', ' '))}
                      </Badge>
                    ))}
                  </div>
                  <div className="hidden md:block text-xs text-slate-600">
                    Joined {formatDate(user.hireDate)}
                  </div>
                  <Badge variant={user.status === 'active' ? 'sage' : 'slate'} dot>
                    {capitalizeFirst(user.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditUser(user); setShowForm(true); }}
                    icon={<Pencil className="h-3.5 w-3.5" />}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to deactivate this user?')) {
                        deleteMutation.mutate(user.id);
                      }
                    }}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="text-slate-500 hover:text-rose-400"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UserFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditUser(null); }}
        user={editUser}
      />
    </div>
  );
}

function UserFormModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User | null }) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(user?.roles?.[0] ?? 'developer');
  const [hireDate, setHireDate] = useState(user?.hireDate?.slice(0, 10) ?? '');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const mutation = useMutation({
    mutationFn: async () => {
      if (user) {
        await api.patch(`/users/${user.id}`, { firstName, lastName });
      } else {
        await api.post('/users', { email, password, firstName, lastName, hireDate, roles: [role] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast({ type: 'success', message: user ? 'User updated' : 'User created' });
      onClose();
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      setError(err.response?.data?.error?.message ?? 'Failed to save user');
    },
  });

  // Reset form when user changes
  useState(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setRole(user?.roles?.[0] ?? 'developer');
    setHireDate(user?.hireDate?.slice(0, 10) ?? '');
    setPassword('');
    setError('');
  });

  const roleOptions = [
    { value: 'developer', label: 'Developer' },
    { value: 'tech_lead', label: 'Tech Lead' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit User' : 'Add User'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        {!user && (
          <>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Role" options={roleOptions} value={role} onChange={(e) => setRole(e.target.value)} />
          <Input label="Hire Date" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} required />
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {user ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
