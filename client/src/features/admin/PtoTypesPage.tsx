import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { PtoType } from '@/types';

export function PtoTypesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editType, setEditType] = useState<PtoType | null>(null);

  const { data: ptoTypes, isLoading } = useQuery({
    queryKey: ['pto-types'],
    queryFn: async () => {
      const res = await api.get('/pto-types');
      return (res.data.data ?? res.data) as PtoType[];
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">PTO Types</h1>
          <p className="text-sm text-slate-500 mt-1">Configure time-off categories</p>
        </div>
        <Button onClick={() => { setEditType(null); setShowForm(true); }} icon={<Plus className="h-4 w-4" />}>
          Add Type
        </Button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !ptoTypes || ptoTypes.length === 0 ? (
        <Card>
          <EmptyState icon={Settings} title="No PTO types" description="Create PTO categories like Vacation, Sick, Personal" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ptoTypes.map((type, idx) => (
            <Card
              key={type.id}
              hover
              className={cn('animate-fade-in opacity-0', `stagger-${Math.min(idx + 1, 5)}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ backgroundColor: type.color + '30', borderColor: type.color }}
                  />
                  <h3 className="text-sm font-medium text-slate-200">{type.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditType(type); setShowForm(true); }}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Code</span>
                  <span className="font-display text-slate-300">{type.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid</span>
                  <Badge variant={type.isPaid ? 'sage' : 'slate'}>{type.isPaid ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requires Approval</span>
                  <Badge variant={type.requiresApproval ? 'amber' : 'slate'}>{type.requiresApproval ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant={type.isActive ? 'sage' : 'slate'} dot>{type.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PtoTypeFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditType(null); }}
        ptoType={editType}
      />
    </div>
  );
}

function PtoTypeFormModal({ open, onClose, ptoType }: { open: boolean; onClose: () => void; ptoType: PtoType | null }) {
  const [name, setName] = useState(ptoType?.name ?? '');
  const [code, setCode] = useState(ptoType?.code ?? '');
  const [color, setColor] = useState(ptoType?.color ?? '#3b82f6');
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { name, code, color, isPaid: true, requiresApproval: true, isActive: true };
      if (ptoType) {
        await api.patch(`/pto-types/${ptoType.id}`, body);
      } else {
        await api.post('/pto-types', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pto-types'] });
      addToast({ type: 'success', message: ptoType ? 'PTO type updated' : 'PTO type created' });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title={ptoType ? 'Edit PTO Type' : 'Create PTO Type'}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Vacation" />
        <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. vacation" />
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-medium tracking-wider uppercase text-slate-400">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-600 bg-slate-800 cursor-pointer"
            />
            <span className="text-sm font-mono text-slate-400">{color}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{ptoType ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
