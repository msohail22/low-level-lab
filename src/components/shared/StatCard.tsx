import type { LucideIcon } from 'lucide-react'

export function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
	return (
		<div className="stat-card">
			<span className="stat-icon"><Icon size={19} /></span>
			<div>
				<span>{label}</span>
				<strong>{value}</strong>
				<small>{detail}</small>
			</div>
		</div>
	)
}
