import { topics } from '@data/topics'
import { PageIntro } from '@components/shared/PageIntro'

export function ProgressPage() {
	return (
		<section>
			<PageIntro eyebrow="Your learning" title="Progress" description="A simple view of what you have explored so far." />
			<div className="progress-overview"><div><span className="progress-number">12</span><span className="progress-total">/ 70 solved</span></div><div className="progress-track"><span style={{ width: '17%' }} /></div><p>You have completed 17% of the available questions.</p></div>
			<div className="panel"><div className="panel-heading"><div><span className="eyebrow">By topic</span><h2>Keep exploring</h2></div></div>{topics.map(({ name, count }) => <div className="progress-row" key={name}><div><strong>{name}</strong><span>0 / {count} solved</span></div><div className="mini-progress"><span /></div></div>)}</div>
		</section>
	)
}
