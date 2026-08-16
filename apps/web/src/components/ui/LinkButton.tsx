import { Link, type LinkProps } from "react-router-dom";

import { Button, type ButtonProps } from "./Button";
import { cn } from "./cn";

type LinkButtonProps = Omit<ButtonProps, "asChild"> &
  Pick<LinkProps, "to" | "replace" | "state"> & {
    className?: string;
  };

/** Button-styled React Router link. */
export function LinkButton({
  to,
  replace,
  state,
  className,
  children,
  variant = "secondary",
  fullWidth,
  size,
  ...rest
}: LinkButtonProps) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={cn(className)}
      {...rest}
    >
      <Link to={to} replace={replace} state={state}>
        {children}
      </Link>
    </Button>
  );
}
