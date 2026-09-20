import type { ReactNode } from 'react';
import { cx } from '../../lib/designTokens';

export type BadgeTone = 'positive' | 'negative' | 'warning' | 'neutral' | 'brand';

/** Tones tuned for light surfaces (institutional banking UI). */
const TONES: Record<BadgeTone, string> = {
  positive: 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100',
  negative: 'text-red-700 bg-red-50 ring-1 ring-red-100',
  warning: 'text-amber-800 bg-amber-50 ring-1 ring-amber-100',
  neutral: 'text-slate-600 bg-slate-100 ring-1 ring-slate-200/80',
  brand: 'text-[#7d5730] bg-[#fbf7ef] ring-1 ring-[#e9d7b0]/80',
};

const DOTS: Record<BadgeTone, string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  warning: 'bg-amber-500',
  neutral: 'bg-slate-400',
  brand: 'bg-[#b68a45]',
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** Status pills show a colour-coded dot. */
  dot?: boolean;
  capitalize?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot = false, capitalize = false, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        capitalize && 'capitalize',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cx('w-1.5 h-1.5 rounded-full', DOTS[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Convenience wrapper mapping account/request status to a tone. */
export function StatusBadge({ status, locked }: { status?: string; locked?: boolean }) {
  if (locked) {
    return (
      <Badge tone="negative" dot>
        Locked
      </Badge>
    );
  }
  const value = (status ?? 'active').toLowerCase();
  const tone: BadgeTone =
    value === 'active' || value === 'approved'
      ? 'positive'
      : value === 'pending'
        ? 'warning'
        : value === 'rejected' || value === 'locked' || value === 'suspended'
          ? 'negative'
          : 'neutral';
  return (
    <Badge tone={tone} dot capitalize>
      {value}
    </Badge>
  );
}
