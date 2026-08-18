import { cn } from '@/shared/lib/cn';

/** Minimal dependency-free sparkline. Decorative — data is conveyed textually. */
export function Sparkline({ data, className, tone = 'primary' }: { data: number[]; className?: string; tone?: 'primary' | 'success' | 'danger' }) {
  if (data.length < 2) return null;
  const width = 96;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke = tone === 'success' ? 'stroke-success' : tone === 'danger' ? 'stroke-danger' : 'stroke-primary';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-7 w-24 shrink-0 overflow-hidden', className)} aria-hidden preserveAspectRatio="none">
      <polyline points={points} fill="none" className={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
