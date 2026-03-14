import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Umbrella,
  Thermometer,
  User as UserIcon,
  Plus,
  CalendarDays,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useRoles } from '@/hooks/useRoles';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { RequestPtoModal } from '@/features/requests/RequestPtoModal';
import { cn, formatHours, capitalizeFirst } from '@/lib/utils';
import { formatDate, formatDateRange } from '@/lib/date-utils';
import api from '@/lib/api';
import type { PtoBalance, PtoRequest } from '@/types';
import { Link } from 'react-router-dom';

const statusVariant: Record<string, 'amber' | 'sage' | 'rose' | 'slate'> = {
  pending: 'amber',
  approved: 'sage',
  denied: 'rose',
  cancelled: 'slate',
};

const typeIcons: Record<string, React.ReactNode> = {
  vacation: <Umbrella className="h-5 w-5" />,
  sick: <Thermometer className="h-5 w-5" />,
  personal: <UserIcon className="h-5 w-5" />,
};

const typeColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  vacation: { bg: 'bg-ocean-500/8', border: 'border-ocean-500/20', text: 'text-ocean-400', icon: 'text-ocean-400' },
  sick: { bg: 'bg-sage-500/8', border: 'border-sage-500/20', text: 'text-sage-400', icon: 'text-sage-400' },
  personal: { bg: 'bg-violet-500/8', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'text-violet-400' },
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isManager } = useRoles();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: async () => {
      const res = await api.get('/balances');
      return res.data.data as PtoBalance[];
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests', 'recent'],
    queryFn: async () => {
      const res = await api.get('/requests', { params: { limit: 5 } });
      return (res.data.data ?? res.data) as PtoRequest[];
    },
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['approvals', 'count'],
    queryFn: async () => {
      const res = await api.get('/approvals');
      const items = res.data.data ?? res.data;
      return Array.isArray(items) ? items.length : 0;
    },
    enabled: isManager,
  });

  if (balancesLoading) return <PageSpinner />;

  const greeting = getGreeting();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <p className="text-xs font-display tracking-[0.2em] uppercase text-amber-500 mb-1">{greeting}</p>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-100">
            {user?.firstName} {user?.lastName}
          </h1>
        </div>
        <Button
          onClick={() => setShowRequestModal(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Request Time Off
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(balances ?? []).map((balance, idx) => {
          const code = balance.ptoType?.code?.toLowerCase() ?? 'vacation';
          const colors = typeColors[code] ?? typeColors.vacation;
          const icon = typeIcons[code] ?? typeIcons.vacation;
          const totalHours = balance.availableHours + balance.pendingHours + balance.usedYtd;

          return (
            <Card
              key={balance.id}
              hover
              className={cn('animate-fade-in opacity-0', `stagger-${idx + 1}`, colors.bg, colors.border)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-2 rounded-lg', colors.bg, colors.border, 'border')}>
                  <span className={colors.icon}>{icon}</span>
                </div>
                <span className="text-[10px] font-display tracking-wider uppercase text-slate-500">
                  {balance.ptoType?.name ?? code}
                </span>
              </div>
              <div className="mb-3">
                <span className={cn('text-3xl font-display font-bold', colors.text)}>
                  {formatHours(balance.availableHours)}
                </span>
                <span className="text-xs text-slate-500 ml-2">available</span>
              </div>
              {/* Usage bar */}
              <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-3">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', code === 'vacation' ? 'bg-ocean-500' : code === 'sick' ? 'bg-sage-500' : 'bg-violet-500')}
                  style={{ width: `${totalHours > 0 ? (balance.usedYtd / totalHours) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{formatHours(balance.usedYtd)} used</span>
                <span>{formatHours(balance.pendingHours)} pending</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats for Managers */}
      {isManager && pendingApprovals !== undefined && pendingApprovals > 0 && (
        <Link to="/approvals">
          <Card hover className="animate-fade-in border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {pendingApprovals} pending approval{pendingApprovals !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-slate-500">Requests awaiting your review</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
            </div>
          </Card>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in stagger-3 opacity-0">
        <QuickAction
          icon={<Plus className="h-4 w-4" />}
          label="Request PTO"
          onClick={() => setShowRequestModal(true)}
        />
        <QuickAction
          icon={<CalendarDays className="h-4 w-4" />}
          label="Team Calendar"
          to="/calendar"
        />
        <QuickAction
          icon={<TrendingUp className="h-4 w-4" />}
          label="Balance History"
          to="/balances"
        />
      </div>

      {/* Recent Requests */}
      <Card className="animate-fade-in stagger-4 opacity-0">
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <Link to="/requests" className="text-xs font-display text-amber-500 hover:text-amber-400 transition-colors">
            View All
          </Link>
        </CardHeader>

        {requestsLoading ? (
          <div className="flex items-center justify-center py-8">
            <PageSpinner />
          </div>
        ) : !requests || requests.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No requests yet"
            description="Submit your first PTO request to get started"
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-2.5 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Type</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Dates</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Hours</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Status</th>
                  <th className="text-left px-5 py-2.5 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-slate-200">{req.ptoType?.name ?? 'PTO'}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {formatDateRange(req.startDate, req.endDate)}
                    </td>
                    <td className="px-5 py-3 font-display text-slate-300">
                      {formatHours(req.totalHours)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[req.status] ?? 'slate'} dot>
                        {capitalizeFirst(req.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {formatDate(req.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RequestPtoModal open={showRequestModal} onClose={() => setShowRequestModal(false)} />
    </div>
  );
}

function QuickAction({ icon, label, onClick, to }: { icon: React.ReactNode; label: string; onClick?: () => void; to?: string }) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-850 border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800 transition-all duration-150 cursor-pointer group">
      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-amber-500/30 transition-colors">
        <span className="text-slate-400 group-hover:text-amber-400 transition-colors">{icon}</span>
      </div>
      <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">{label}</span>
    </div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return <button onClick={onClick} className="text-left w-full">{content}</button>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
