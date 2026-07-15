import { forwardRef, useId } from 'react';

const cn = (...values: unknown[]) => values.filter(Boolean).join(' ');

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, ...props }, ref) => {
    const generatedId = useId();
    const radioId = props.id ?? `radio-${generatedId}`;
    
    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={radioId}
              type="radio"
              className={cn(
                'h-4 w-4 text-accent-gold border-premium',
                'focus:ring-accent-gold focus:ring-2 focus:ring-offset-secondary-800',
                'transition-all duration-300',
                error && 'border-red-500',
                className
              )}
              {...props}
            />
          </div>
          {(label || description) && (
            <div className="ml-3 text-sm">
              {label && (
              <label htmlFor={radioId} className="font-medium text-white">
                  {label}
                </label>
              )}
              {description && (
                <p className="text-gray-400">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 motion-safe:animate-[autofans-fade-in_160ms_ease-out]"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
