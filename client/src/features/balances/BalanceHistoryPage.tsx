import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ArrowUpCircle, ArrowDownCircle, RefreshCw, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatHours } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import api from '@/lib/api';
import type { BalanceLedgerEntry, PtoType, LedgerTxnType } from '@/types';

const txnIcons: Record<LedgerTxnType, React.ReactNode> = {
  accrual: <ArrowUpCircle className="h-4 w-4 text-sage-400" />,
  debit: <ArrowDownCircle className="h-4 w-4 text-rose-400" />,
  adjustment: <RefreshCw className="h-4 w-4 text-amber-400" />,
  carryover: <RefreshCw className="h-4 w-4 text-ocean-400" />,
  expiration: <Minus className="h-4 w-4 text-slate-400" />,
};

const txnBadgeVariant: Record<LedgerTxnType, 'sage' | 'rose' | 'amber' | 'ocean' | 'slate'> = {
  accrual: 'sage',
  debit: 'rose',
  adjustment: 'amber',
  carryover: 'ocean',
  expiration: 'slate',
};

export function BalanceHistoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: ptoTypes } = useQuery({
    queryKey: ['pto-types'],
    queryFn: async () => {
      const res = await api.get('/pto-types');
      return (res.data.data ?? res.data) as PtoType[];
    },
  });

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['balance-ledger', typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (typeFilter !== 'all') params.ptoTypeId = typeFilter;
      const res = await api.get('/balances/ledger', { params });
      return (res.data.data ?? res.data) as BalanceLedgerEntry[];
    },
  });

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...(ptoTypes ?? []).map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">Balance History</h1>
        <p className="text-sm text-slate-500 mt-1">View all balance transactions and ledger entries</p>
      </div>

      <div className="flex items-center gap-3 animate-fade-in stagger-1 opacity-0">
        <div className="w-48">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !ledger || ledger.length === 0 ? (
        <Card>
          <EmptyState
            icon={History}
            title="No transactions"
            description="Balance transactions will appear here as you accrue and use PTO"
          />
        </Card>
      ) : (
        <Card padding="none" className="animate-fade-in stagger-2 opacity-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-3 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Date</th>
                  <th className="text-left px-5 py-3 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Transaction</th>
                  <th className="text-left px-5 py-3 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Description</th>
                  <th className="text-right px-5 py-3 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Hours</th>
                  <th className="text-right px-5 py-3 text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap text-xs">
                      {formatDate(entry.effectiveDate)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-slate-300 text-xs">{entry.ptoType?.name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {txnIcons[entry.transactionType]}
                        <Badge variant={txnBadgeVariant[entry.transactionType]}>
                          {entry.transactionType}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                      {entry.description}
                    </td>
                    <td className="px-5 py-3 text-right font-display">
                      <span className={cn(
                        entry.hours > 0 ? 'text-sage-400' : entry.hours < 0 ? 'text-rose-400' : 'text-slate-400'
                      )}>
                        {entry.hours > 0 ? '+' : ''}{formatHours(entry.hours)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-display text-slate-300">
                      {formatHours(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
