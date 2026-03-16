import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import {
  format,
  getCalendarDays,
  nextMonth,
  prevMonth,
  startOfMonth,
  isSameMonth,
  parseISO,
} from '@/lib/date-utils';
import api from '@/lib/api';
import type { PtoRequest, Holiday } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const typeColorClasses: Record<string, string> = {
  vacation: 'bg-ocean-500/20 text-ocean-400 border-ocean-500/30',
  vac: 'bg-ocean-500/20 text-ocean-400 border-ocean-500/30',
  sick: 'bg-sage-500/20 text-sage-400 border-sage-500/30',
  personal: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  per: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  pers: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const holidayClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const monthStr = format(currentMonth, 'yyyy-MM');

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar', 'team', monthStr],
    queryFn: async () => {
      const res = await api.get('/calendar/team', {
        params: { month: monthStr },
      });
      return (res.data.data ?? res.data) as PtoRequest[];
    },
  });

  const { data: holidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await api.get('/holidays');
      return (res.data.data ?? res.data) as Holiday[];
    },
  });

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PtoRequest[]>();
    for (const event of events ?? []) {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      const current = new Date(start);
      while (current <= end) {
        const key = format(current, 'yyyy-MM-dd');
        const arr = map.get(key) ?? [];
        arr.push(event);
        map.set(key, arr);
        current.setDate(current.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of holidays ?? []) {
      map.set(h.date.slice(0, 10), h);
    }
    return map;
  }, [holidays]);

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-display font-bold tracking-tight text-slate-100">Team Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">View team PTO and company holidays</p>
      </div>

      <Card padding="none" className="animate-fade-in stagger-1 opacity-0">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((m) => prevMonth(m))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display font-bold tracking-wide text-slate-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((m) => nextMonth(m))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {eventsLoading ? (
          <div className="py-16"><PageSpinner /></div>
        ) : (
          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-display font-semibold tracking-wider uppercase text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-700/20 rounded-lg overflow-hidden">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = dateKey === today;
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const holiday = holidaysByDate.get(dateKey);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      'min-h-[90px] p-1.5 bg-slate-850 transition-colors',
                      !isCurrentMonth && 'opacity-30',
                      isWeekend && isCurrentMonth && 'bg-slate-900',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-xs font-display w-6 h-6 flex items-center justify-center rounded-md',
                          isToday
                            ? 'bg-amber-500 text-slate-900 font-bold'
                            : 'text-slate-400'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {holiday && (
                        <div className={cn('text-[9px] px-1.5 py-0.5 rounded border truncate', holidayClass)}>
                          {holiday.name}
                        </div>
                      )}
                      {dayEvents.slice(0, 2).map((evt) => {
                        const code = evt.ptoTypeCode?.toLowerCase() ?? 'vacation';
                        return (
                          <div
                            key={evt.id}
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded border truncate',
                              typeColorClasses[code] ?? typeColorClasses.vacation
                            )}
                          >
                            {evt.user?.firstName ?? ''} {evt.user?.lastName?.charAt(0) ?? ''}.
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-slate-500 px-1.5">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 animate-fade-in stagger-2 opacity-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-ocean-500" />Vacation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sage-500" />Sick
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />Personal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Holiday
        </span>
      </div>
    </div>
  );
}
