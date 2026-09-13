import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { QuestionRow } from '@components/questions/QuestionRow'
import { getTopic, type ApiTopic } from '@services/content-api'

export function TopicDetailPage() {
	const { topicId = '' } = useParams()
	const [topic, setTopic] = useState<ApiTopic | null>(null)
	const [error, setError] = useState('')
	useEffect(() => { getTopic(topicId).then(setTopic).catch((reason: Error) => setError(reason.message)) }, [topicId])
	if (error) return <div className="empty-state">{error}</div>
	if (!topic) return <div className="empty-state">Loading topic…</div>
	return <section>
		<Link className="back-link" to="/topics">← Back to topics</Link>
		<div className="page-intro"><span className="eyebrow">Topic detail</span><h1>{topic.name}</h1><p>{topic.description ?? 'Explore questions in this learning area.'}</p></div>
		<div className="stat-grid"><div className="stat-card"><div><span>Questions</span><strong>{topic.total}</strong></div></div><div className="stat-card"><div><span>Solved</span><strong>{topic.solved}</strong></div></div></div>
		{topic.subtopics && topic.subtopics.length > 0 && <div className="panel"><div className="panel-heading"><div><span className="eyebrow">Subtopics</span><h2>Explore by area</h2></div></div><div className="subtopic-list">{topic.subtopics.map((subtopic) => <span className="tag" key={subtopic}>{subtopic}</span>)}</div></div>}
		<div className="panel topic-question-list"><div className="panel-heading"><div><span className="eyebrow">Question bank</span><h2>Questions in {topic.name}</h2></div><Link className="text-link" to={`/questions?topicId=${topic.id}`}>View all</Link></div>{topic.questions?.map((question) => <QuestionRow key={question.id} question={question} />)}</div>
	</section>
}
