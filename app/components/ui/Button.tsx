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
  primary: 'bg-gold-gradient text-secondary-900 shadow-[0_8px_20px_rgba(214,181,91,0.16)] hover:brightness-[1.04] hover:shadow-glow focus:ring-accent-gold focus:ring-offset-secondary-800',
  secondary: 'border border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.1] focus:ring-accent-gold focus:ring-offset-secondary-800',
  outline: 'border border-white/18 text-gray-200 hover:border-accent-gold/65 hover:bg-accent-gold/10 hover:text-white focus:ring-accent-gold focus:ring-offset-secondary-800',
  ghost: 'text-gray-300 hover:bg-white/[0.06] hover:text-white focus:ring-accent-gold focus:ring-offset-secondary-800',
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
      'inline-flex items-center justify-center rounded-xl font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 enabled:hover:-translate-y-px enabled:active:translate-y-0',
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
