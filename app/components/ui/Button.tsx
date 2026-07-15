import { cloneElement, forwardRef, isValidElement } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  /** Render a single interactive child (for example a router Link) with the
   * button styles. This avoids invalid <a><button /></a> markup. */
  asChild?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-gold-gradient text-secondary-900 hover:shadow-glow focus:ring-accent-gold focus:ring-offset-secondary-800',
  secondary: 'bg-secondary-800/50 text-white hover:bg-secondary-700/50 border border-accent-gold/20 focus:ring-accent-gold focus:ring-offset-secondary-800',
  outline: 'border-2 border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10 hover:text-accent-gold focus:ring-accent-gold focus:ring-offset-secondary-800',
  ghost: 'text-white/70 hover:bg-accent-gold/10 hover:text-accent-gold focus:ring-accent-gold focus:ring-offset-secondary-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-secondary-800',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, loadingText, disabled, asChild = false, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    const classes = cn(
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 enabled:hover:scale-[1.02] enabled:active:scale-[0.98]',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      buttonVariants[variant],
      buttonSizes[size],
      className
    );

    if (asChild && isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: cn(classes, child.props.className),
        'aria-disabled': isDisabled || undefined,
        'aria-busy': loading || undefined,
        ...props,
      });
    }
    
    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <>
            <span
              className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="sr-only">Se încarcă...</span>
          </>
        )}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
