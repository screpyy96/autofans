import { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
  default: 'bg-secondary-800/50 text-white border border-accent-gold/20',
  primary: 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30',
  secondary: 'bg-secondary-700/50 text-gray-200 border border-accent-gold/20',
  success: 'bg-green-900/20 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-900/20 text-red-400 border border-red-500/30',
  outline: 'border border-accent-gold/30 text-accent-gold bg-transparent',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
