import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const colors = [
  'bg-ocean-600 text-ocean-100',
  'bg-violet-600 text-violet-100',
  'bg-amber-600 text-amber-300',
  'bg-sage-600 text-sage-100',
  'bg-rose-600 text-rose-100',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function Avatar({ firstName, lastName, size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const colorIdx = hashName(`${firstName}${lastName}`) % colors.length;

  return (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center font-display font-bold shrink-0',
        sizeClasses[size],
        colors[colorIdx],
        className
      )}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
