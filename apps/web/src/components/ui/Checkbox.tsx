import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";

import { cn } from "./cn";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[color:var(--line)] bg-[color:var(--panel)] data-[state=checked]:border-[color:var(--accent)] data-[state=checked]:bg-[color:var(--accent)]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="text-[color:var(--on-accent)]">
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
        <path
          d="M2 6.5 4.5 9 10 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
