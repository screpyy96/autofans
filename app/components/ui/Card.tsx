import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const cardVariants = {
  default: 'bg-glass border border-premium',
  elevated: 'bg-glass shadow-card border border-premium',
  outlined: 'bg-glass border-2 border-premium',
};

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    const { 
      onDrag, 
      onDragEnd, 
      onDragStart, 
      onAnimationStart, 
      onAnimationEnd, 
      onAnimationIteration,
      ...restProps 
    } = props;
    const MotionDiv = hoverable ? motion.div : 'div';
    
    if (hoverable) {
      return (
        <MotionDiv
          ref={ref}
          className={cn(
            'rounded-2xl transition-all duration-300 backdrop-blur-xl',
            cardVariants[variant],
            cardPadding[padding],
            'cursor-pointer hover:border-accent-gold hover:shadow-glow',
            className
          )}
          whileHover={{ 
            boxShadow: 'var(--shadow-card-hover)',
            y: -4,
            scale: 1.02
          }}
          whileTap={{ scale: 0.98 }}
          {...restProps}
        >
          {children}
        </MotionDiv>
      );
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300 backdrop-blur-xl',
          cardVariants[variant],
          cardPadding[padding],
          className
        )}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-400', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';