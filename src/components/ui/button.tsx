import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#057A55] text-white hover:bg-[#065f46] active:bg-[#065f46]',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  danger: 'bg-white border border-red-200 text-red-500 hover:bg-red-50 active:bg-red-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base rounded-xl gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  as?: 'button' | 'a';
  href?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#057A55]/50 focus-visible:ring-offset-1';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={[base, variantClasses[variant], sizeClasses[size], disabledClass, widthClass, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && (
        <svg
          data-testid="button-spinner"
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {!loading && iconLeft && <span className="shrink-0">{iconLeft}</span>}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
