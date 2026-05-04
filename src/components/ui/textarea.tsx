import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? 'true' : undefined}
          className={[
            'w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-none',
            'focus:ring-2 focus:ring-[#057A55]/20 focus:border-[#057A55]',
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 hover:border-gray-300',
            props.disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'bg-white',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && helper && <p className="text-xs text-gray-400">{helper}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
