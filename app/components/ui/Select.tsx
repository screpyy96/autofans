import { forwardRef, useId } from 'react';

const cn = (...values: unknown[]) => values.filter(Boolean).join(' ');

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, placeholder, options, ...props }, ref) => {
    const generatedId = useId();
    const selectId = props.id ?? `select-${generatedId}`;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full px-4 py-3 border border-accent-gold/30 rounded-xl',
              'text-white bg-secondary-800/50 backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold focus:ring-offset-secondary-800',
              'transition-all duration-300 hover:border-accent-gold/50',
              'appearance-none cursor-pointer',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className="bg-secondary-800 text-white"
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-accent-gold" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 motion-safe:animate-[autofans-fade-in_160ms_ease-out]"
          >
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

Select.displayName = 'Select';
