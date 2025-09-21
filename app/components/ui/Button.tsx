import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { useAccessibility } from '~/hooks/useAccessibility';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-gold-gradient text-secondary-900 hover:shadow-glow focus:ring-accent-gold focus:ring-offset-secondary-800',
  secondary: 'bg-secondary-700 text-white hover:bg-secondary-600 focus:ring-accent-gold focus:ring-offset-secondary-800',
  outline: 'border-2 border-premium text-gray-300 hover:bg-accent-gold/10 hover:text-accent-gold hover:border-accent-gold focus:ring-accent-gold focus:ring-offset-secondary-800',
  ghost: 'text-gray-300 hover:bg-accent-gold/10 hover:text-accent-gold focus:ring-accent-gold focus:ring-offset-secondary-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-secondary-800',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, loadingText, disabled, children, ...props }, ref) => {
    const { reduceMotion } = useAccessibility();
    const { 
      onDrag, 
      onDragEnd, 
      onDragStart, 
      onAnimationStart, 
      onAnimationEnd, 
      onAnimationIteration,
      ...restProps 
    } = props;
    
    const isDisabled = disabled || loading;
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        whileHover={reduceMotion ? {} : { scale: isDisabled ? 1 : 1.02 }}
        whileTap={reduceMotion ? {} : { scale: isDisabled ? 1 : 0.98 }}
        {...restProps}
      >
        {loading && (
          <>
            <motion.div
              className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
              animate={reduceMotion ? {} : { rotate: 360 }}
              transition={reduceMotion ? {} : { duration: 1, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            />
            <span className="sr-only">Se încarcă...</span>
          </>
        )}
        {loading && loadingText ? loadingText : children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';