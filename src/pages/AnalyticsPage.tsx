import { useEffect, useState } from 'react'
import { BarChart3, Database, ShieldCheck } from 'lucide-react'

import { listQuestions, type ApiQuestion } from '@services/content-api'
import { PageIntro } from '@components/shared/PageIntro'
import { StatCard } from '@components/shared/StatCard'

export function AnalyticsPage() {
	const [questions, setQuestions] = useState<ApiQuestion[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	useEffect(() => {
		listQuestions({ pageSize: 100 })
			.then((questionResult) => { setQuestions(questionResult.items) })
			.catch((reason: Error) => setError(reason.message))
			.finally(() => setLoading(false))
	}, [])
	if (loading) return <div className="empty-state">Loading analytics…</div>
	if (error) return <div className="empty-state">{error}</div>
	const published = questions.filter((question) => question.status === 'published').length
	return <section>
		<PageIntro eyebrow="For people who publish questions" title="Analytics" description="A quiet view of what readers return to, solve, and save." />
		<div className="stat-grid">
			<StatCard label="Reads" value="3,412" detail="Last 30 days" icon={BarChart3} />
			<StatCard label="Solved after reading" value="61%" detail="Conversion to practice" icon={ShieldCheck} />
			<StatCard label="Saved for later" value="28" detail={`${published} published questions`} icon={Database} />
		</div>
		<div className="panel">
			<div className="panel-heading"><div><span className="eyebrow">Daily reads / 30 days</span><h2>Readers keep returning to fundamentals.</h2></div></div>
			<svg viewBox="0 0 700 150" role="img" aria-label="Daily reads trend chart" style={{ width: '100%', height: 150, borderBottom: '1px solid var(--rule)' }}><polyline fill="none" stroke="var(--index-blue)" strokeWidth="2" points="0,124 55,112 110,118 165,84 220,96 275,70 330,82 385,52 440,62 495,38 550,49 605,22 700,34" /></svg>
		</div>
	</section>
}
