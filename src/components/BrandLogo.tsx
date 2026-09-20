import { cx } from '../lib/designTokens';

interface BrandLogoProps {
  className?: string;
  withWordmark?: boolean;
  size?: number;
  light?: boolean;
}

export function BrandLogo({
  className,
  withWordmark = true,
  size = 36,
  light = false,
}: BrandLogoProps) {
  const navy = '#10243f';
  const gold = '#b68a45';
  const ink = light ? '#ffffff' : navy;

  return (
    <span className={cx('inline-flex items-center gap-3', className)}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[14px]"
        style={{
          width: size,
          height: size,
          background: light ? 'rgba(255,255,255,.08)' : '#10243f',
          border: light ? '1px solid rgba(255,255,255,.14)' : '1px solid rgba(16,36,63,.08)',
          boxShadow: light ? '0 10px 28px rgba(0,0,0,.18)' : '0 10px 24px rgba(16,36,63,.12)',
        }}
        aria-hidden="true"
      >
        <svg
          width={size * 0.64}
          height={size * 0.64}
          viewBox="0 0 40 40"
          fill="none"
          role="img"
        >
          <path
            d="M9 29V11h11.5c5.2 0 8.7 2.7 8.7 7 0 3.2-1.8 5.5-4.9 6.5L29 29h-5.6l-4.1-6.7h-5V29H9Zm5.3-10.8h5.6c2.5 0 4-1.1 4-3s-1.5-3-4-3h-5.6v6Z"
            fill={gold}
          />
          <path d="M7 33h26" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M31.5 9.5v8" stroke={gold} strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
        </svg>
      </span>
      {withWordmark && (
        <span
          className={cx(
            'font-semibold tracking-[-0.025em] leading-none',
            light ? 'text-white' : 'text-slate-950',
          )}
          style={{ fontSize: Math.max(15, size * 0.43) }}
        >
          Finance Capital <span className={light ? 'text-slate-300' : 'text-slate-500'}>Florida</span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
