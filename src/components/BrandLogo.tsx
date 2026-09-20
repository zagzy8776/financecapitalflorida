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

  return (
    <span className={cx('inline-flex items-center gap-3', className)}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[14px]"
        style={{
          width: size,
          height: size,
          background: light ? 'rgba(255,255,255,.08)' : navy,
          border: light ? '1px solid rgba(255,255,255,.14)' : '1px solid rgba(16,36,63,.08)',
          boxShadow: light ? '0 10px 28px rgba(0,0,0,.18)' : '0 10px 24px rgba(16,36,63,.12)',
        }}
        aria-hidden="true"
      >
        <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 40 40" fill="none">
          <text
            x="20"
            y="25"
            textAnchor="middle"
            fontFamily="Manrope, DM Sans, sans-serif"
            fontSize="12"
            fontWeight="700"
            letterSpacing="0.5"
            fill={gold}
          >
            FCF
          </text>
          <path d="M8 31h24" stroke={gold} strokeWidth="2" strokeLinecap="round" opacity=".85" />
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
