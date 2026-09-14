const regions = [
	{ address: '0xFFFF', label: 'stack', note: 'grows down' },
	{ address: '0xFF20', label: 'frame: parse()', note: 'you are here', active: true },
	{ address: '0x7A00', label: 'mmap', note: 'shared libraries' },
	{ address: '0x4100', label: 'heap', note: 'grows up' },
	{ address: '0x2000', label: '.bss / .data', note: 'statics' },
	{ address: '0x0400', label: '.text', note: 'your code' },
]

export function MemorySpaceWidget() {
	return <div className="memory-widget">
		<div className="widget-heading"><span className="eyebrow">Process address space</span><span className="mono">virtual memory / 64-bit</span></div>
		<div className="memory-map">{regions.map((region) => <div className={`memory-row ${region.active ? 'active' : ''}`} key={region.address}><span className="mono">{region.address}</span><strong>{region.label}</strong><small>{region.note}</small></div>)}</div>
	</div>
}
