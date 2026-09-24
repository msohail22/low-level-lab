/**
 * Descent — three bars widening as they fall: the memory hierarchy, and the
 * act of dropping a level. Geometry is fixed on a 48 unit grid; see the
 * design canvas before changing any number here.
 */
export function BrandMark({ size = 36 }: { size?: number }) {
	return (
		<svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
			<rect x="2" y="2" width="44" height="44" rx="8" fill="var(--amber-bright)" />
			<rect x="12" y="11" width="10" height="6" rx="1.5" fill="#26231F" />
			<rect x="12" y="21" width="17" height="6" rx="1.5" fill="#26231F" />
			<rect x="12" y="31" width="24" height="6" rx="1.5" fill="#26231F" />
		</svg>
	)
}
