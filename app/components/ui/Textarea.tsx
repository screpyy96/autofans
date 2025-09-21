import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, resize = 'vertical', ...props }, ref) => {
    const { 
      onDrag, 
      onDragEnd, 
      onDragStart, 
      onAnimationStart, 
      onAnimationEnd, 
      onAnimationIteration,
      ...restProps 
    } = props;
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <motion.textarea
          ref={ref}
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
          whileFocus={{ scale: 1.01 }}
          {...restProps}
        />
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

Textarea.displayName = 'Textarea';