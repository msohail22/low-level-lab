import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "./cn";

/* CVA export used by LinkButton / consumers — ok for this kit file */
/* eslint-disable react-refresh/only-export-components */

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-pill)] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_40%,transparent)] disabled:cursor-not-allowed disabled:opacity-65",
  {
    variants: {
      variant: {
        primary:
          "border border-transparent bg-[color:var(--accent-btn)] text-[color:var(--on-accent)] hover:bg-[color:var(--accent)]",
        secondary:
          "border border-[color:var(--line)] bg-[color:var(--panel)] text-[color:var(--ink)] hover:bg-[color:var(--surface-2)]",
        ghost:
          "border border-transparent bg-transparent text-[color:var(--ink)] hover:bg-[color:var(--surface-2)]",
        danger:
          "border border-transparent bg-[color:var(--danger)] text-[#fafafa] hover:opacity-90",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-[1.2rem] py-[0.7rem]",
        lg: "px-6 py-3 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, asChild = false, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
