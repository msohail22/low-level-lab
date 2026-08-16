import * as React from "react";

import { cn } from "./cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-control)] border border-[color:var(--line)] bg-[color:var(--white)] px-[0.9rem] py-3 text-[color:var(--ink)] outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_55%,var(--line))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-65",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
