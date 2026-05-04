import * as React from 'react';

export type CardVariant = 'default' | 'interactive' | 'highlighted';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ variant = 'default', className = '', ...props }: CardProps) {
  const base = 'bg-white rounded-2xl border border-gray-100 shadow-sm';
  const variantClass =
    variant === 'interactive'
      ? 'hover:shadow-md hover:border-gray-200 cursor-pointer transition-all'
      : variant === 'highlighted'
      ? 'border-[#057A55] ring-1 ring-[#057A55]/20'
      : '';

  return (
    <div
      className={[base, variantClass, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['px-5 pt-5', className].filter(Boolean).join(' ')} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['px-5 py-4', className].filter(Boolean).join(' ')} {...props} />;
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['px-5 py-4 border-t border-gray-100', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={['text-base font-semibold text-gray-900 leading-snug', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export function CardDescription({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={['text-sm text-gray-500 mt-0.5', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

// Keep CardAction for backward compat
export function CardAction({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['col-start-2 row-span-2 row-start-1 self-start justify-self-end', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
