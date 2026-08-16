import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "./cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        muted:
          "bg-[color:var(--surface-2)] text-[color:var(--muted)]",
        accent:
          "bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--accent)]",
        success:
          "bg-[color:var(--success-bg)] text-[color:var(--success)]",
        warn: "bg-[color:var(--warn-bg)] text-[color:var(--warn)]",
      },
    },
    defaultVariants: { variant: "muted" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
