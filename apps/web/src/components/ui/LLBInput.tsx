import type { InputHTMLAttributes } from "react";

type LLBInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function LLBInput({ className = "", ...props }: LLBInputProps) {
	return (
		<input
			className={`w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] ${className}`.trim()}
			{...props}
		/>
	);
}