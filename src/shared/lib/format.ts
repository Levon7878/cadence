import { formatDistanceToNowStrict } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export function formatCurrency(value: number, compact = false): string {
  return compact ? compactCurrencyFormatter.format(value) : currencyFormatter.format(value);
}

/** Accepts a ratio (0.42) OR whole percent (42) via `whole`. */
export function formatPercent(value: number, whole = false): string {
  return percentFormatter.format(whole ? value / 100 : value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(input: string | Date): string {
  return dateFormatter.format(new Date(input));
}

export function formatShortDate(input: string | Date): string {
  return shortDateFormatter.format(new Date(input));
}

export function formatRelativeTime(input: string | Date): string {
  return formatDistanceToNowStrict(new Date(input), { addSuffix: true });
}

/** Whole days until (positive) or since (negative) a date, from today. */
export function daysUntil(input: string | Date): number {
  const target = new Date(input);
  const now = new Date();
  const ms = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
