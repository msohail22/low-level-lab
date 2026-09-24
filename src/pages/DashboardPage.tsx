import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { QuestionRow } from '@components/questions/QuestionRow'
import { MemorySpaceWidget } from '@components/shared/MemorySpaceWidget'
import { listQuestions, listTopics, type ApiQuestion, type ApiTopic } from '@services/content-api'
import { useEffect, useState } from 'react'

export function DashboardPage() {
	const [questions, setQuestions] = useState<ApiQuestion[]>([])
	const [topics, setTopics] = useState<ApiTopic[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	useEffect(() => {
		Promise.all([listQuestions({ pageSize: 3 }), listTopics()]).then(([questionResult, topicResult]) => {
			setQuestions(questionResult.items)
			setTopics(topicResult)
		}).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
	}, [])
	const total = topics.reduce((sum, topic) => sum + topic.total, 0)
	const solved = topics.reduce((sum, topic) => sum + topic.solved, 0)
	const opened = topics.filter((topic) => topic.solved > 0).length
	const percentage = total ? Math.round((solved / total) * 100) : 0
	return (
		<>
			{loading && <div className="empty-state">Loading dashboard…</div>}
			{error && <div className="empty-state">{error}</div>}
			<section className="hero">
				<div>
					<span className="eyebrow">Today</span>
					<h1>You left off inside the stack frame.</h1>
					<p>The next useful question is usually one level below the abstraction you trust.</p>
				</div>
				<div className="hero-readout">
					<strong>{percentage}%</strong>
					<span>of the bank held up</span>
				</div>
			</section>
			<div className="stat-grid">
				<div className="stat-card"><div><span>Held up</span><strong>{solved}/{total}</strong><small>answered right first try</small></div></div>
				<div className="stat-card"><div><span>Areas opened</span><strong>{opened}/{topics.length}</strong><small>topics with progress</small></div></div>
				<div className="stat-card"><div><span>Still open</span><strong>{total - solved}</strong><small>questions left in the bank</small></div></div>
			</div>
			<section className="content-grid">
				<div className="panel">
					<div className="panel-heading"><div><span className="eyebrow">Continue</span><h2>Pick up where you left off</h2></div><Link to="/questions" className="text-link">View all <ChevronRight size={15} /></Link></div>
					<div className="recent-list">{questions.length ? questions.slice(0, 3).map((question) => <QuestionRow key={question.id} question={question} />) : <div className="empty-state">No questions are available yet.</div>}</div>
				</div>
				<div className="panel topic-panel">
					<div className="panel-heading"><div><span className="eyebrow">Explore</span><h2>Topics</h2></div><Link to="/topics" className="text-link">See all <ChevronRight size={15} /></Link></div>
					{topics.length ? topics.slice(0, 3).map((topic) => <Link className="topic-row" to={`/topics/${topic.id}`} key={topic.id}><span><strong>{topic.name}</strong><small>{topic.solved} of {topic.total} held up</small></span><ChevronRight size={16} /></Link>) : <div className="empty-state">No topics are available yet.</div>}
				</div>
			</section>
			<div style={{ marginTop: 28 }}><MemorySpaceWidget /></div>
		</>
	)
}
