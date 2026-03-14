import { format, parseISO, differenceInBusinessDays, isWeekend, eachDayOfInterval, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, getDay } from 'date-fns';

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatDateRange(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  if (start === end) return format(s, 'MMM d, yyyy');
  if (isSameMonth(s, e)) {
    return `${format(s, 'MMM d')} - ${format(e, 'd, yyyy')}`;
  }
  return `${format(s, 'MMM d')} - ${format(e, 'MMM d, yyyy')}`;
}

export function businessDaysBetween(start: string, end: string): number {
  return differenceInBusinessDays(parseISO(end), parseISO(start)) + 1;
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDay = getDay(monthStart);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - startDay);
  const endDay = getDay(monthEnd);
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - endDay));
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function prevMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

export { format, parseISO, isSameMonth, startOfMonth, endOfMonth };
