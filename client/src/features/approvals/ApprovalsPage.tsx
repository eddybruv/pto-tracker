import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Check, X, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { cn, formatHours } from '@/lib/utils';
import { formatDateRange } from '@/lib/date-utils';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { PtoRequest } from '@/types';

export function ApprovalsPage() {
  const [selectedRequest, setSelectedRequest] = useState<PtoRequest | null>(null);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await api.get('/approvals');
      return (res.data.data ?? res.data) as PtoRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approve' | 'deny' }) => {
      await api.post(`/approvals/${requestId}/${action}`, { comment: comment || undefined });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      addToast({
        type: 'success',
        message: `Request ${variables.action === 'approve' ? 'approved' : 'denied'} successfully`,
      });
      setSelectedRequest(null);
      setComment('');
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to process approval' });
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage pending PTO requests</p>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !approvals || approvals.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckSquare}
            title="All caught up"
            description="No pending requests to review"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((req, idx) => (
            <Card
              key={req.id}
              hover
              padding="none"
              className={cn('animate-fade-in opacity-0', `stagger-${Math.min(idx + 1, 5)}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    firstName={req.firstName ?? 'U'}
                    lastName={req.lastName ?? 'N'}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {req.firstName} {req.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Badge variant="ocean">{req.ptoTypeName ?? 'PTO'}</Badge>
                      <span>{formatDateRange(req.startDate, req.endDate)}</span>
                      <span className="font-display">{formatHours(req.totalHours)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(req)}
                    icon={<MessageSquare className="h-3.5 w-3.5" />}
                  >
                    Review
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => approveMutation.mutate({ requestId: req.requestId, action: 'deny' })}
                    loading={approveMutation.isPending}
                    icon={<X className="h-3.5 w-3.5" />}
                    className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate({ requestId: req.requestId, action: 'approve' })}
                    loading={approveMutation.isPending}
                    icon={<Check className="h-3.5 w-3.5" />}
                    className="bg-sage-600 hover:bg-sage-500 shadow-none"
                  >
                    Approve
                  </Button>
                </div>
              </div>
              {req.notes && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">{req.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setComment(''); }}
        title="Review Request"
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar
                firstName={selectedRequest.firstName ?? 'U'}
                lastName={selectedRequest.lastName ?? 'N'}
                size="lg"
              />
              <div>
                <p className="font-medium text-slate-200">
                  {selectedRequest.firstName} {selectedRequest.lastName}
                </p>
                <p className="text-xs text-slate-500">{selectedRequest.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div>
                <p className="text-[10px] font-display tracking-wider uppercase text-slate-500 mb-0.5">Type</p>
                <p className="text-sm text-slate-200">{selectedRequest.ptoTypeName ?? 'PTO'}</p>
              </div>
              <div>
                <p className="text-[10px] font-display tracking-wider uppercase text-slate-500 mb-0.5">Hours</p>
                <p className="text-sm text-slate-200">{formatHours(selectedRequest.totalHours)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-display tracking-wider uppercase text-slate-500 mb-0.5">Dates</p>
                <p className="text-sm text-slate-200">{formatDateRange(selectedRequest.startDate, selectedRequest.endDate)}</p>
              </div>
              {selectedRequest.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] font-display tracking-wider uppercase text-slate-500 mb-0.5">Notes</p>
                  <p className="text-sm text-slate-400">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <Textarea
              label="Comment (optional)"
              placeholder="Add a note about your decision..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => approveMutation.mutate({ requestId: selectedRequest.requestId, action: 'deny' })}
                loading={approveMutation.isPending}
                icon={<X className="h-4 w-4" />}
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              >
                Deny
              </Button>
              <Button
                onClick={() => approveMutation.mutate({ requestId: selectedRequest.requestId, action: 'approve' })}
                loading={approveMutation.isPending}
                icon={<Check className="h-4 w-4" />}
                className="bg-sage-600 hover:bg-sage-500 shadow-none"
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
