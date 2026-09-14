const levels = [
	['L1 cache', '4c', '32 KB'],
	['L2 cache', '14c', '512 KB'],
	['L3 cache', '60c', '16 MB'],
	['DRAM', '220c', 'where you lose'],
]

export function HardwareLatencyWidget() {
	return <div className="latency-widget">
		<div className="widget-heading"><span className="eyebrow">Memory hierarchy</span><span className="mono">cycles / access</span></div>
		{levels.map(([name, cycles, size], index) => <div className={`latency-row ${index === levels.length - 1 ? 'active' : ''}`} key={name}><strong>{name}</strong><span className="mono">{cycles}</span><small>{size}</small></div>)}
	</div>
}
