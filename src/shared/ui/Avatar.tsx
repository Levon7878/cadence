import { cn } from '@/shared/lib/cn';
import { initials } from '@/shared/lib/format';

const SIZES = { xs: 'size-5 text-[10px]', sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-12 text-base' } as const;

/** Deterministic hue from a string so a person keeps the same color everywhere. */
function hueFrom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const hue = hueFrom(name);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        SIZES[size],
        className,
      )}
      style={src ? undefined : { backgroundColor: `hsl(${hue} 55% 45%)` }}
      title={name}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
