import { useEffect, useState } from 'react'

import { PageIntro } from '@components/shared/PageIntro'
import { getProgress, listTopics } from '@services/content-api'

export function ProgressPage() {
	const [progress, setProgress] = useState<{ solved: number; total: number; topics: Array<{ topicId: string; total: number; solved: number }> } | null>(null)
	const [names, setNames] = useState(new Map<string, string>())
	const [error, setError] = useState('')
	useEffect(() => {
		Promise.all([getProgress(), listTopics()]).then(([result, topics]) => {
			setProgress(result)
			setNames(new Map(topics.map((topic) => [topic.id, topic.name])))
		}).catch((reason: Error) => setError(reason.message))
	}, [])
	if (error) return <div className="empty-state">{error}</div>
	if (!progress) return <div className="empty-state">Loading progress…</div>
	const percentage = progress.total ? Math.round((progress.solved / progress.total) * 100) : 0
	return <section>
		<PageIntro eyebrow="Your learning" title="Progress" description="A simple view of what you have explored so far." />
		<div className="progress-overview"><div><span className="progress-number">{progress.solved}</span><span className="progress-total">/ {progress.total} solved</span></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div><p>You have completed {percentage}% of the available questions.</p></div>
		<div className="panel"><div className="panel-heading"><div><span className="eyebrow">By topic</span><h2>Keep exploring</h2></div></div>{progress.topics.map((topic) => <div className="progress-row" key={topic.topicId}><div><strong>{names.get(topic.topicId) ?? topic.topicId}</strong><span>{topic.solved} / {topic.total} solved</span></div><div className="mini-progress"><span style={{ width: `${topic.total ? (topic.solved / topic.total) * 100 : 0}%` }} /></div></div>)}</div>
	</section>
}
