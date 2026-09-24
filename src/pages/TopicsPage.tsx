import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '@components/shared/PageIntro'
import { listTopics, type ApiTopic } from '@services/content-api'

export function TopicsPage() {
	const [topics, setTopics] = useState<ApiTopic[]>([])
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)
	useEffect(() => { listTopics().then(setTopics).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)) }, [])

	return <section>
		<PageIntro eyebrow="Learning areas" title="Topics" description="Each area is a place a value can sit. Start where your model feels thinnest." />
		{loading ? <div className="empty-state">Loading topics…</div> : error ? <div className="empty-state">{error}</div> : <div className="topic-grid">{topics.map((topic) => <Link className="large-topic-card" to={`/topics/${topic.id}`} key={topic.id}><span className="topic-icon violet"><BookOpen size={20} /></span><h2>{topic.name}</h2><p>{topic.description ?? 'Questions to explore'}</p><p>{topic.solved} of {topic.total} held up</p><span className="card-arrow"><ChevronRight size={17} /></span></Link>)}</div>}
		{!error && topics.length === 0 && <div className="empty-state">No topics are available yet.</div>}
	</section>
}
