import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/designTokens';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'outline' | 'dashed';
  interactive?: boolean;
  as?: ElementType;
}

const VARIANTS: Record<NonNullable<CardProps['variant']>, string> = {
  raised:
    'bg-white border border-[#e2e7ee] shadow-[0_8px_24px_rgba(12,27,51,0.05)]',
  outline: 'bg-white border border-[#e2e7ee]',
  dashed: 'bg-white border border-dashed border-[#cfd7e3]',
};

export function Card({
  variant = 'raised',
  interactive = false,
  as: Tag = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={cx(
        'rounded-[18px] transition-all duration-200',
        VARIANTS[variant],
        interactive &&
          'hover:-translate-y-0.5 hover:border-[#b68a45]/55 hover:shadow-[0_14px_36px_rgba(12,27,51,0.08)] cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export interface SectionHeadingProps {
  title: string;
  icon?: ElementType;
  dot?: boolean;
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeading({
  title,
  icon: Icon,
  dot = false,
  action,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div className={cx('flex items-center justify-between gap-4 mb-4', className)}>
      <h2
        id={id}
        className="text-lg sm:text-xl font-semibold text-[#0c1b33] flex items-center gap-2.5 font-display tracking-[-0.02em]"
      >
        {Icon ? (
          <Icon className="w-5 h-5 text-[#b68a45]" />
        ) : dot ? (
          <span className="w-2 h-2 rounded-full bg-[#b68a45]" />
        ) : null}
        {title}
      </h2>
      {action}
    </div>
  );
}
