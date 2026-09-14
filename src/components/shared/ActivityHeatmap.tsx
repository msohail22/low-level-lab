export function ActivityHeatmap() {
	const cells = Array.from({ length: 60 }, (_, index) => (index * 7 + 3) % 6)
	return <div className="heatmap" aria-label="60 day activity heatmap">{cells.map((level, index) => <span className={`heat-${level}`} title={`${level} solved`} key={index} />)}</div>
}
