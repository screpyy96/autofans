import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, placeholder, options, ...props }, ref) => {
    const { 
      onDrag, 
      onDragEnd, 
      onDragStart, 
      onAnimationStart, 
      onAnimationEnd, 
      onAnimationIteration,
      ...restProps 
    } = props;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <motion.select
            ref={ref}
            className={cn(
              'block w-full px-4 py-3 border border-premium rounded-2xl',
              'text-white bg-glass backdrop-blur-xl',
              'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold focus:ring-offset-secondary-800',
              'transition-all duration-300 hover:border-accent-gold/50',
              'appearance-none cursor-pointer',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            whileFocus={{ scale: 1.01 }}
            {...restProps}
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
          </motion.select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-accent-gold" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
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