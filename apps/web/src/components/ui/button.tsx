import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap border-2 text-body-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celo-yellow disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-celo-yellow border-celo-purple text-celo-purple hover:bg-celo-purple hover:text-celo-yellow',
        destructive:
          'bg-celo-orange border-celo-purple text-celo-purple hover:bg-celo-purple hover:text-celo-orange',
        outline:
          'border-2 border-celo-purple bg-transparent text-celo-purple hover:bg-celo-purple hover:text-celo-yellow',
        secondary:
          'bg-celo-green border-celo-purple text-celo-yellow hover:bg-celo-purple hover:text-celo-yellow',
        ghost: 'border-transparent text-celo-purple hover:bg-celo-tan-medium hover:border-celo-purple',
        link: 'border-transparent text-celo-purple underline-offset-4 hover:underline',
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
