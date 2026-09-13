import { BookOpen, CheckCircle2, ChevronRight, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import { QuestionRow } from '@components/questions/QuestionRow'
import { StatCard } from '@components/shared/StatCard'
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
	return (
		<>
			{loading && <div className="empty-state">Loading dashboard…</div>}
			{error && <div className="empty-state">{error}</div>}
			<section className="hero">
				<div><span className="eyebrow">Tuesday, September 13</span><h1>Keep building your mental model.</h1><p>Explore focused questions and strengthen your understanding of how things work.</p></div>
				<div className="hero-art"><Sparkles size={24} /><span>Small steps<br /><strong>compound.</strong></span></div>
			</section>
			<div className="stat-grid">
				<StatCard label="Questions solved" value={String(solved)} detail={`of ${total} available`} icon={CheckCircle2} />
				<StatCard label="Questions available" value={String(total)} detail="Published for learning" icon={Target} />
				<StatCard label="Topics explored" value={String(topics.filter((topic) => topic.solved > 0).length)} detail={`of ${topics.length} topics`} icon={BookOpen} />
			</div>
			<section className="content-grid">
				<div className="panel">
					<div className="panel-heading"><div><span className="eyebrow">Continue learning</span><h2>Pick up where you left off</h2></div><Link to="/questions" className="text-link">View all <ChevronRight size={15} /></Link></div>
					<div className="recent-list">{questions.length ? questions.slice(0, 3).map((question) => <QuestionRow key={question.id} question={question} />) : <div className="empty-state">No questions are available yet.</div>}</div>
				</div>
				<div className="panel topic-panel">
					<div className="panel-heading"><div><span className="eyebrow">Explore</span><h2>Topics</h2></div><Link to="/topics" className="text-link">See all <ChevronRight size={15} /></Link></div>
					{topics.length ? topics.slice(0, 3).map((topic) => <Link className="topic-row" to={`/topics/${topic.id}`} key={topic.id}><span className="topic-icon violet"><BookOpen size={17} /></span><span><strong>{topic.name}</strong><small>{topic.total} questions</small></span><ChevronRight size={16} /></Link>) : <div className="empty-state">No topics are available yet.</div>}
				</div>
			</section>
		</>
	)
}
