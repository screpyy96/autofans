import { forwardRef, useId } from 'react';

const cn = (...values: unknown[]) => values.filter(Boolean).join(' ');

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, resize = 'vertical', ...props }, ref) => {
    const generatedId = useId();
    const textareaId = props.id ?? `textarea-${generatedId}`;
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'block w-full px-4 py-3 border border-premium rounded-2xl',
            'placeholder-gray-400 text-white bg-glass backdrop-blur-xl',
            'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold focus:ring-offset-secondary-800',
            'transition-all duration-300 hover:border-accent-gold/50',
            'min-h-[80px]',
            resizeClasses[resize],
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400 motion-safe:animate-[autofans-fade-in_160ms_ease-out]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
