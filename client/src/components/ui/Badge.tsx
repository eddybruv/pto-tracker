import { cn } from '@/lib/utils';

type BadgeVariant = 'amber' | 'sage' | 'rose' | 'ocean' | 'violet' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  sage: 'bg-sage-500/15 text-sage-400 border-sage-500/20',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  ocean: 'bg-ocean-500/15 text-ocean-400 border-ocean-500/20',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  amber: 'bg-amber-400',
  sage: 'bg-sage-400',
  rose: 'bg-rose-400',
  ocean: 'bg-ocean-400',
  violet: 'bg-violet-400',
  slate: 'bg-slate-400',
};

export function Badge({ variant = 'slate', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-display font-medium tracking-wide border',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
