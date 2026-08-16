import * as React from "react";

import { cn } from "./cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-[var(--radius-control)] border border-[color:var(--line)] bg-[color:var(--white)] px-[0.9rem] py-3 text-[color:var(--ink)] outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_55%,var(--line))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-65",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
