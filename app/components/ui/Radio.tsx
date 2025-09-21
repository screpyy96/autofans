import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, ...props }, ref) => {
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
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <motion.input
              ref={ref}
              type="radio"
              className={cn(
                'h-4 w-4 text-accent-gold border-premium',
                'focus:ring-accent-gold focus:ring-2 focus:ring-offset-secondary-800',
                'transition-all duration-300',
                error && 'border-red-500',
                className
              )}
              whileTap={{ scale: 0.95 }}
              {...restProps}
            />
          </div>
          {(label || description) && (
            <div className="ml-3 text-sm">
              {label && (
                <label className="font-medium text-white">
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
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';