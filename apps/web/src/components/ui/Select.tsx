import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";

import { cn } from "./cn";

/* Radix re-exports are part of the public Select API */
/* eslint-disable react-refresh/only-export-components */

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[color:var(--line)] bg-[color:var(--white)] px-[0.9rem] py-3 text-left text-sm text-[color:var(--ink)] outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_55%,var(--line))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-65 data-[placeholder]:text-[color:var(--muted)]",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon className="text-[color:var(--muted)]">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <path
          d="M3 4.5 6 7.5 9 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-control)] border border-[color:var(--line)] bg-[color:var(--white)] shadow-md",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-[color:var(--ink)] outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-[color:var(--surface-2)] data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

type SimpleSelectOption = { value: string; label: React.ReactNode };

type SimpleSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SimpleSelectOption[];
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
};

/** Convenient single-value select for forms. */
export function SimpleSelect({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  options,
  disabled,
  className,
  id,
}: SimpleSelectProps) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
