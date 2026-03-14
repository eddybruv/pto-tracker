import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, hover, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-slate-850 border border-slate-700/50',
        'shadow-[0_4px_24px_rgba(0,0,0,0.15)]',
        paddingClasses[padding],
        hover && 'transition-all duration-200 hover:border-slate-600 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-display font-semibold tracking-wide uppercase text-slate-300', className)}>
      {children}
    </h3>
  );
}
