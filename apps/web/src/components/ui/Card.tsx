import * as React from "react";

import { cn } from "./cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[color:var(--line)] bg-[color:var(--white)] shadow-[0_1px_2px_rgb(26_26_26_/_4%)]",
        className,
      )}
      {...props}
    />
  );
}
