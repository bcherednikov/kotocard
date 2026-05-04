import * as React from 'react';

export type BadgeVariant = 'gray' | 'green' | 'amber' | 'indigo' | 'teal' | 'red';

const variantClasses: Record<BadgeVariant, string> = {
  gray:   'bg-gray-100 text-gray-600',
  green:  'bg-[#057A55]/10 text-[#057A55]',
  amber:  'bg-amber-100 text-amber-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  teal:   'bg-teal-100 text-teal-700',
  red:    'bg-red-100 text-red-600',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'gray', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
