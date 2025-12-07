import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-4 border-celo-purple bg-celo-tan-light px-4 py-3 text-body-bold text-base text-celo-purple placeholder:text-celo-brown/60 focus:outline-none focus:ring-4 focus:ring-celo-yellow focus:border-celo-yellow transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

