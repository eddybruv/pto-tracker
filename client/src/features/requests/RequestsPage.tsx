import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, XCircle, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { RequestPtoModal } from './RequestPtoModal';
import { cn, formatHours, capitalizeFirst } from '@/lib/utils';
import { formatDateRange, formatDate } from '@/lib/date-utils';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { PtoRequest } from '@/types';

const statusVariant: Record<string, 'amber' | 'sage' | 'rose' | 'slate'> = {
  pending: 'amber',
  approved: 'sage',
  denied: 'rose',
  cancelled: 'slate',
};

export function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/requests', { params });
      return (res.data.data ?? res.data) as PtoRequest[];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/requests/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      addToast({ type: 'success', message: 'Request cancelled' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to cancel request' });
    },
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">My Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your PTO requests</p>
        </div>
        <Button onClick={() => setShowRequestModal(true)} icon={<Plus className="h-4 w-4" />}>
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 animate-fade-in stagger-1 opacity-0">
        <Filter className="h-4 w-4 text-slate-500" />
        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Request List */}
      {isLoading ? (
        <PageSpinner />
      ) : !requests || requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="No requests found"
            description={statusFilter !== 'all' ? 'Try changing the filter' : 'Submit a PTO request to get started'}
            action={
              <Button size="sm" onClick={() => setShowRequestModal(true)} icon={<Plus className="h-3.5 w-3.5" />}>
                Request PTO
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req, idx) => (
            <RequestRow
              key={req.id}
              request={req}
              className={cn('animate-fade-in opacity-0', `stagger-${Math.min(idx + 1, 5)}`)}
              onCancel={() => cancelMutation.mutate(req.id)}
              cancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      <RequestPtoModal open={showRequestModal} onClose={() => setShowRequestModal(false)} />
    </div>
  );
}

function RequestRow({
  request,
  className,
  onCancel,
  cancelling,
}: {
  request: PtoRequest;
  className?: string;
  onCancel: () => void;
  cancelling: boolean;
}) {
  return (
    <Card hover padding="none" className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="hidden sm:block">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-slate-200 truncate">
                {request.ptoTypeName ?? 'PTO'}
              </span>
              <Badge variant={statusVariant[request.status] ?? 'slate'} dot>
                {capitalizeFirst(request.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatDateRange(request.startDate, request.endDate)}</span>
              <span className="font-display">{formatHours(request.totalHours)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-600">{formatDate(request.createdAt)}</span>
          {request.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              loading={cancelling}
              icon={<XCircle className="h-3.5 w-3.5" />}
              className="text-slate-500 hover:text-rose-400"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      {request.notes && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
            {request.notes}
          </p>
        </div>
      )}
    </Card>
  );
}
