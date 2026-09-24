import { BrandMark } from '@components/layout/BrandMark'

// Real numbers, not decoration: the latency ladder is the thing this
// product is about, sized to what each level actually costs.
const ladder = [
	{ level: 'L1', cycles: '4 cycles', width: '6%' },
	{ level: 'L2', cycles: '14 cycles', width: '13%' },
	{ level: 'L3', cycles: '60 cycles', width: '32%' },
	{ level: 'DRAM', cycles: '220 cycles', width: '100%' },
]

export function AuthAside() {
	return (
		<aside className="auth-aside">
			<div className="auth-brand">
				<BrandMark size={34} />
				<strong>Low Level Lab</strong>
			</div>

			<div>
				<h1 className="auth-claim">The next useful question is one level down.</h1>
				<p>
					A question bank for the parts of the machine you use every day and have never
					had to explain.
				</p>
			</div>

			<div className="auth-specimen">
				<p className="auth-specimen-label">What a value costs to reach</p>
				<div className="auth-ladder">
					{ladder.map((row) => (
						<div key={row.level}>
							<span>{row.level}</span>
							<em><i style={{ width: row.width }} /></em>
							{row.cycles}
						</div>
					))}
				</div>
			</div>
		</aside>
	)
}
