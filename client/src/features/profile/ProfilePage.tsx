import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { capitalizeFirst } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { Mail, Calendar, Shield, Clock } from 'lucide-react';

const roleBadge: Record<string, 'amber' | 'ocean' | 'violet'> = {
  admin: 'amber',
  tech_lead: 'ocean',
  developer: 'violet',
};

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const fields = [
    { icon: <Mail className="h-4 w-4" />, label: 'Email', value: user.email },
    { icon: <Calendar className="h-4 w-4" />, label: 'Hire Date', value: formatDate(user.hireDate) },
    { icon: <Shield className="h-4 w-4" />, label: 'Roles', value: null, badge: true },
    { icon: <Clock className="h-4 w-4" />, label: 'Member Since', value: formatDate(user.createdAt) },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your account information</p>
      </div>

      <Card className="animate-fade-in stagger-1 opacity-0">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <Avatar firstName={user.firstName} lastName={user.lastName} size="lg" />
          <div>
            <h2 className="text-lg font-display font-bold text-slate-100">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-500">
                {field.icon}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-display tracking-wider uppercase text-slate-500">{field.label}</p>
                {field.badge ? (
                  <div className="flex gap-1.5 mt-0.5">
                    {(user.roles ?? []).map((role) => (
                      <Badge key={role} variant={roleBadge[role] ?? 'slate'}>
                        {capitalizeFirst(role.replace('_', ' '))}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-200">{field.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
