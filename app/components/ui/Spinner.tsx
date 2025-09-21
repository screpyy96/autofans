import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray' | 'gold';
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const spinnerColors = {
  primary: 'border-accent-gold',
  secondary: 'border-secondary-600',
  white: 'border-white',
  gray: 'border-gray-400',
  gold: 'border-accent-gold',
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <motion.div
          className={cn(
            'border-2 border-t-transparent rounded-full',
            spinnerSizes[size],
            spinnerColors[color]
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray' | 'gold';
  className?: string;
}

export const Loading = ({ text = 'Loading...', size = 'md', color = 'primary', className }: LoadingProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Spinner size={size} color={color} />
      {text && (
        <motion.p
          className="text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};