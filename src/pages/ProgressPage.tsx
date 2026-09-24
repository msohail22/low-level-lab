import { useEffect, useState } from 'react'

import { PageIntro } from '@components/shared/PageIntro'
import { getProgress, getProgressHistory, listTopics, type AttemptHistory } from '@services/content-api'
import { ActivityHeatmap } from '@components/shared/ActivityHeatmap'

export function ProgressPage() {
	const [progress, setProgress] = useState<{ solved: number; total: number; topics: Array<{ topicId: string; total: number; solved: number }> } | null>(null)
	const [names, setNames] = useState(new Map<string, string>())
	const [error, setError] = useState('')
	const [history, setHistory] = useState<AttemptHistory[]>([])
	useEffect(() => {
		Promise.all([getProgress(), listTopics(), getProgressHistory()]).then(([result, topics, attempts]) => {
			setProgress(result)
			setNames(new Map(topics.map((topic) => [topic.id, topic.name])))
			setHistory(attempts.items)
		}).catch((reason: Error) => setError(reason.message))
	}, [])
	if (error) return <div className="empty-state">{error}</div>
	if (!progress) return <div className="empty-state">Loading progress…</div>
	const percentage = progress.total ? Math.round((progress.solved / progress.total) * 100) : 0
	return <section>
		<PageIntro eyebrow="The progress ledger" title="What has held up" description="Questions you answered correctly on the first try, and the ones still worth another pass." />
		<div className="panel"><div className="panel-heading"><div><span className="eyebrow">Last 60 days</span><h2>Activity</h2></div><span className="mono">0 to 5+ a day</span></div><ActivityHeatmap /></div>
		<div className="progress-overview"><div><span className="progress-number">{progress.solved}</span><span className="progress-total">/ {progress.total} solved</span></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div><p>You have completed {percentage}% of the available questions.</p></div>
		<div className="panel"><div className="panel-heading"><div><span className="eyebrow">By topic</span><h2>Keep exploring</h2></div></div>{progress.topics.map((topic) => <div className="progress-row" key={topic.topicId}><div><strong>{names.get(topic.topicId) ?? topic.topicId}</strong><span>{topic.solved} / {topic.total} solved</span></div><div className="mini-progress"><span style={{ width: `${topic.total ? (topic.solved / topic.total) * 100 : 0}%` }} /></div></div>)}</div>
		<div className="panel history-panel"><div className="panel-heading"><div><span className="eyebrow">Question history</span><h2>Recent attempts</h2></div></div>{history.length === 0 ? <div className="empty-state">Your answered questions will appear here.</div> : history.map((attempt) => <div className="history-row" key={attempt.id}><span><strong>{attempt.questionTitle}</strong><small>{new Date(attempt.createdAt).toLocaleString()}</small></span><span className={attempt.correct ? 'history-correct' : 'history-incorrect'}>{attempt.correct ? 'Correct' : 'Try again'}</span></div>)}</div>
	</section>
}
