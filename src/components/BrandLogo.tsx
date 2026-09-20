import { cx } from '../lib/designTokens';

interface BrandLogoProps {
  className?: string;
  withWordmark?: boolean;
  size?: number;
  light?: boolean;
}

export function BrandLogo({ className, withWordmark = true, size = 36, light = true }: BrandLogoProps) {
  const navy = '#10243f';
  const gold = '#b68a45';
  const ink = light ? '#ffffff' : navy;

  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-xl"
        style={{ width: size, height: size, background: navy, boxShadow: '0 8px 20px rgba(16,36,63,.14)' }}
        aria-hidden="true"
      >
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 32 32" fill="none">
          <path d="M7 24V8h8.5c4.1 0 7 2.4 7 6 0 2.7-1.6 4.8-4.2 5.6L22.8 24h-4.3l-3.9-5.8H11V24H7Zm4-9h4c2 0 3.3-1 3.3-2.7S17 9.7 15 9.7h-4V15Z" fill={gold}/>
          <path d="M5 27h22" stroke={gold} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
      {withWordmark && (
        <span className={cx('font-semibold tracking-tight leading-none', light ? 'text-white' : 'text-slate-900')} style={{ fontSize: Math.max(14, size * 0.42) }}>
          Finance Capital <span className={light ? 'text-slate-300' : 'text-slate-500'}>Florida</span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
