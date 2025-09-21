import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
  default: 'bg-secondary-700 text-white',
  primary: 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30',
  secondary: 'bg-secondary-600 text-gray-300',
  success: 'bg-green-900/20 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-900/20 text-red-400 border border-red-500/30',
  outline: 'border border-premium text-gray-300 bg-transparent',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
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
      <motion.div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium backdrop-blur-sm transition-all duration-300',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.05 }}
        {...restProps}
      >
        {children}
      </motion.div>
    );
  }
);

Badge.displayName = 'Badge';