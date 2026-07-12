import type { HTMLAttributes } from "react";

type LLBCardProps = HTMLAttributes<HTMLDivElement>;

export default function LLBCard({ className = "", ...props }: LLBCardProps) {
	return <div className={`surface-card ${className}`.trim()} {...props} />;
}