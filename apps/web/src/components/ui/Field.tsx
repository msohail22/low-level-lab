import * as React from "react";

import { cn } from "./cn";
import { Label } from "./Label";

type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label != null && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && (
        <p className="text-xs text-[color:var(--muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[color:var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
