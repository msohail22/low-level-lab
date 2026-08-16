import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "./cn";

const alertVariants = cva("rounded-[var(--radius-control)] border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-[color:var(--line)] bg-[color:var(--info-bg)] text-[color:var(--info)]",
      success:
        "border-[color:color-mix(in_srgb,var(--success)_25%,var(--line))] bg-[color:var(--success-bg)] text-[color:var(--success)]",
      error:
        "border-[color:color-mix(in_srgb,var(--danger)_25%,var(--line))] bg-[color:var(--danger-bg)] text-[color:var(--danger)]",
    },
  },
  defaultVariants: { variant: "info" },
});

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, role = "alert", ...props }: AlertProps) {
  return (
    <div
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
