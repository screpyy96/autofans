import { forwardRef, useRef, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { useAccessibility } from '~/hooks/useAccessibility';
import { getAriaLabel, getAriaDescribedBy } from '~/utils/accessibility';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, leftIconClassName, id, required, ...props }, ref) => {
    const { reduceMotion } = useAccessibility();
    const reactId = useId();
    // Ensure stable IDs across server and client to avoid hydration mismatches
    const inputId = useRef(id ?? `input-${reactId}`).current;
    const errorId = useRef(`input-error-${reactId}`).current;
    const helperId = useRef(`input-helper-${reactId}`).current;
    
    const { 
      onDrag, 
      onDragEnd, 
      onDragStart, 
      onAnimationStart, 
      onAnimationEnd, 
      onAnimationIteration,
      ...restProps 
    } = props;
    
    const ariaLabel = label ? getAriaLabel(label, helperText, required, !!error) : undefined;
    const ariaDescribedBy = getAriaDescribedBy(
      error ? errorId : undefined,
      helperText ? helperId : undefined
    );
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-white mb-2",
              required && "after:content-['*'] after:ml-1 after:text-accent-gold"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div
                className={cn(
                  'h-5 w-5',
                  leftIconClassName ? leftIconClassName : 'text-accent-gold'
                )}
                aria-hidden="true"
              >
                {leftIcon}
              </div>
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            aria-label={!label ? ariaLabel : undefined}
            aria-describedby={ariaDescribedBy}
            aria-invalid={!!error}
            aria-required={required}
            className={cn(
              'block w-full px-4 py-3 border border-premium rounded-2xl',
              'placeholder-white/70 text-white bg-glass backdrop-blur-xl',
              'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold focus:ring-offset-secondary-800',
              'transition-all duration-300 hover:border-accent-gold/50',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            whileFocus={reduceMotion ? {} : { scale: 1.01 }}
            {...restProps}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-accent-gold" aria-hidden="true">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            aria-live="polite"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
