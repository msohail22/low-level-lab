export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
	return (
		<div className="page-intro">
			<span className="eyebrow">{eyebrow}</span>
			<h1>{title}</h1>
			<p>{description}</p>
		</div>
	)
}
