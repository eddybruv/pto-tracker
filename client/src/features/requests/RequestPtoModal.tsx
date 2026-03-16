import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import type { PtoType } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RequestPtoModal({ open, onClose }: Props) {
  const [ptoTypeId, setPtoTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const { data: ptoTypes } = useQuery({
    queryKey: ['pto-types'],
    queryFn: async () => {
      const res = await api.get('/pto-types');
      return (res.data.data ?? res.data) as PtoType[];
    },
  });

  const calcTotalDays = (start: string, end: string): number => {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    let count = 0;
    const current = new Date(s);
    while (current <= e) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const totalDays = calcTotalDays(startDate, endDate);
      const res = await api.post('/requests', {
        ptoTypeId,
        startDate,
        endDate,
        totalDays,
        notes: notes || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      addToast({ type: 'success', message: 'PTO request submitted successfully' });
      handleClose();
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      setError(err.response?.data?.error?.message ?? 'Failed to submit request');
    },
  });

  const handleClose = () => {
    setPtoTypeId('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ptoTypeId || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date');
      return;
    }
    mutation.mutate();
  };

  const typeOptions = (ptoTypes ?? []).map((t) => ({ value: t.id, label: t.name }));

  return (
    <Modal open={open} onClose={handleClose} title="Request Time Off" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="PTO Type"
          options={typeOptions}
          value={ptoTypeId}
          onChange={(e) => setPtoTypeId(e.target.value)}
          placeholder="Select type..."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
        </div>
        <Textarea
          label="Notes (optional)"
          placeholder="Any details your manager should know..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
