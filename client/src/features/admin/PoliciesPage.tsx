import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { Policy, PtoType } from '@/types';

export function PoliciesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await api.get('/policies');
      return (res.data.data ?? res.data) as Policy[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      addToast({ type: 'success', message: 'Policy deactivated' });
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">Policies</h1>
          <p className="text-sm text-slate-500 mt-1">Manage PTO accrual and balance policies</p>
        </div>
        <Button onClick={() => { setEditPolicy(null); setShowForm(true); }} icon={<Plus className="h-4 w-4" />}>
          Add Policy
        </Button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !policies || policies.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No policies" description="Create accrual policies for your team" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy, idx) => (
            <Card
              key={policy.id}
              hover
              className={cn('animate-fade-in opacity-0', `stagger-${Math.min(idx + 1, 5)}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">{policy.name}</h3>
                  <Badge variant={policy.isActive ? 'sage' : 'slate'} dot className="mt-1">
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditPolicy(policy); setShowForm(true); }}
                    icon={<Pencil className="h-3.5 w-3.5" />}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(policy.id)}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="text-slate-500 hover:text-rose-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Accrual Rate</span>
                  <p className="font-display text-slate-300 mt-0.5">{policy.accrualRate}d / {policy.accrualFrequency}</p>
                </div>
                <div>
                  <span className="text-slate-500">Max Accrual</span>
                  <p className="font-display text-slate-300 mt-0.5">{policy.maxAccrual ? `${policy.maxAccrual}d` : 'Unlimited'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Carryover Cap</span>
                  <p className="font-display text-slate-300 mt-0.5">{policy.carryoverCap ? `${policy.carryoverCap}d` : 'None'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Probation</span>
                  <p className="font-display text-slate-300 mt-0.5">{policy.probationDays}d</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PolicyFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditPolicy(null); }}
        policy={editPolicy}
      />
    </div>
  );
}

function PolicyFormModal({ open, onClose, policy }: { open: boolean; onClose: () => void; policy: Policy | null }) {
  const [name, setName] = useState(policy?.name ?? '');
  const [ptoTypeId, setPtoTypeId] = useState(policy?.ptoTypeId ?? '');
  const [accrualRate, setAccrualRate] = useState(String(policy?.accrualRate ?? 1));
  const [accrualFrequency, setAccrualFrequency] = useState<string>(policy?.accrualFrequency ?? 'monthly');
  const [maxAccrual, setMaxAccrual] = useState(String(policy?.maxAccrual ?? ''));
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: ptoTypes } = useQuery({
    queryKey: ['pto-types'],
    queryFn: async () => {
      const res = await api.get('/pto-types');
      return (res.data.data ?? res.data) as PtoType[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        name,
        ptoTypeId,
        accrualRate: Number(accrualRate),
        accrualFrequency,
        maxAccrual: maxAccrual ? Number(maxAccrual) : null,
      };
      if (policy) {
        await api.patch(`/policies/${policy.id}`, body);
      } else {
        await api.post('/policies', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      addToast({ type: 'success', message: policy ? 'Policy updated' : 'Policy created' });
      onClose();
    },
  });

  const typeOptions = (ptoTypes ?? []).map((t) => ({ value: t.id, label: t.name }));
  const freqOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={policy ? 'Edit Policy' : 'Create Policy'}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Input label="Policy Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Select label="PTO Type" options={typeOptions} value={ptoTypeId} onChange={(e) => setPtoTypeId(e.target.value)} placeholder="Select type..." />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Accrual Rate (days)" type="number" value={accrualRate} onChange={(e) => setAccrualRate(e.target.value)} required />
          <Select label="Frequency" options={freqOptions} value={accrualFrequency} onChange={(e) => setAccrualFrequency(e.target.value)} />
        </div>
        <Input label="Max Accrual (days, optional)" type="number" value={maxAccrual} onChange={(e) => setMaxAccrual(e.target.value)} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{policy ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
