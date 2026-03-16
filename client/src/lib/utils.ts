import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDays(days: number): string {
  if (days === 0) return '0 days';
  const abs = Math.abs(days);
  const sign = days < 0 ? '-' : '';
  if (abs === 1) return `${sign}1 day`;
  return `${sign}${abs} days`;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
