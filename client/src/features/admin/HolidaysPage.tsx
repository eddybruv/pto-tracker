import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Plus, Trash2, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { Holiday } from '@/types';

export function HolidaysPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await api.get('/holidays');
      return (res.data.data ?? res.data) as Holiday[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      addToast({ type: 'success', message: 'Holiday removed' });
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">Holidays</h1>
          <p className="text-sm text-slate-500 mt-1">Manage company holidays and observances</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
          Add Holiday
        </Button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !holidays || holidays.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarPlus} title="No holidays" description="Add company holidays" />
        </Card>
      ) : (
        <div className="space-y-2">
          {holidays.map((holiday, idx) => (
            <Card
              key={holiday.id}
              hover
              padding="none"
              className={cn('animate-fade-in opacity-0', `stagger-${Math.min(idx + 1, 5)}`)}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Star className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{holiday.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{formatDate(holiday.date)}</span>
                      {holiday.isRecurring && <Badge variant="amber">Recurring</Badge>}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(holiday.id)}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-slate-500 hover:text-rose-400"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <HolidayFormModal open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

function HolidayFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/holidays', { name, date, isRecurring });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      addToast({ type: 'success', message: 'Holiday added' });
      setName('');
      setDate('');
      setIsRecurring(false);
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Holiday">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Input label="Holiday Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Independence Day" />
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/30"
          />
          <span className="text-sm text-slate-300">Recurring annually</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Add Holiday</Button>
        </div>
      </form>
    </Modal>
  );
}
