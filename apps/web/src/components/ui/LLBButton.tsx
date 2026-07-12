import type { ButtonHTMLAttributes } from "react";

type LLBButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary";
};

export default function LLBButton({
	variant = "secondary",
	className = "",
	...props
}: LLBButtonProps) {
	const baseClassName =
		"inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]";
	const variantClassName =
		variant === "primary"
			? "border border-transparent bg-[color:var(--accent-btn)] text-white shadow-[0_12px_28px_rgba(168,65,36,0.22)] hover:translate-y-[-1px]"
			: "border border-[color:var(--line)] bg-white text-[color:var(--ink)] hover:border-[color:var(--accent)]/25 hover:bg-[color:var(--surface-2)]";

	return <button className={`${baseClassName} ${variantClassName} ${className}`.trim()} {...props} />;
}