import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { cn } from "./cn";

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-sm font-medium text-[color:var(--ink)]",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
