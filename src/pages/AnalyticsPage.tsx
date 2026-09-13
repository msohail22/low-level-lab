import { useEffect, useState } from 'react'
import { BarChart3, Database, ShieldCheck } from 'lucide-react'

import { listQuestions, listTopics, type ApiQuestion, type ApiTopic } from '@services/content-api'
import { PageIntro } from '@components/shared/PageIntro'
import { StatCard } from '@components/shared/StatCard'

export function AnalyticsPage() {
	const [questions, setQuestions] = useState<ApiQuestion[]>([])
	const [topics, setTopics] = useState<ApiTopic[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	useEffect(() => {
		Promise.all([listQuestions({ pageSize: 100 }), listTopics()])
			.then(([questionResult, topicResult]) => { setQuestions(questionResult.items); setTopics(topicResult) })
			.catch((reason: Error) => setError(reason.message))
			.finally(() => setLoading(false))
	}, [])
	if (loading) return <div className="empty-state">Loading analytics…</div>
	if (error) return <div className="empty-state">{error}</div>
	const published = questions.filter((question) => question.status === 'published').length
	const solved = topics.reduce((sum, topic) => sum + topic.solved, 0)
	return <section>
		<PageIntro eyebrow="Operational overview" title="Analytics" description="Aggregate product metrics only. No personal browsing or request-origin tracking is collected." />
		<div className="stat-grid">
			<StatCard label="Questions indexed" value={String(questions.length)} detail="Current API result set" icon={BarChart3} />
			<StatCard label="Published questions" value={String(published)} detail="Available to learners" icon={ShieldCheck} />
			<StatCard label="Solved answers" value={String(solved)} detail="Aggregate progress records" icon={Database} />
		</div>
		<div className="panel">
			<div className="panel-heading"><div><span className="eyebrow">Privacy-first reporting</span><h2>What this page measures</h2></div></div>
			<p className="detail-description">This UI reports content and aggregate learning totals from existing APIs. It intentionally does not identify visitors, record IP addresses, or add behavioral tracking.</p>
		</div>
	</section>
}
