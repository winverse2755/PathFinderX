import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-game font-semibold tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2 focus-visible:ring-offset-game-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-game-primary text-white border border-game-primary/50 rounded-md shadow-button hover:bg-game-primary/80 hover:shadow-glow-primary',
        destructive:
          'bg-game-error text-white border border-game-error/50 rounded-md shadow-button hover:bg-game-error/80',
        outline:
          'border-2 border-game-primary bg-transparent text-game-primary rounded-md hover:bg-game-primary hover:text-white',
        secondary:
          'bg-game-secondary text-game-bg border border-game-secondary/50 rounded-md shadow-button hover:bg-game-secondary/80 hover:shadow-glow-secondary',
        ghost: 'border-transparent text-game-text-muted hover:bg-game-surface hover:text-white rounded-md',
        link: 'border-transparent text-game-primary underline-offset-4 hover:underline',
        accent: 'bg-game-accent text-game-bg border border-game-accent/50 rounded-md shadow-button hover:bg-game-accent/80 hover:shadow-glow-accent',
      },
      size: {
        default: 'h-12 px-6 py-3 text-base',
        sm: 'h-10 px-4 py-2 text-sm',
        lg: 'h-14 px-8 py-4 text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
