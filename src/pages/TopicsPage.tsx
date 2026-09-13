import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '@components/shared/PageIntro'
import { listTopics, type ApiTopic } from '@services/content-api'

export function TopicsPage() {
	const [topics, setTopics] = useState<ApiTopic[]>([])
	const [error, setError] = useState('')
	useEffect(() => { listTopics().then(setTopics).catch((reason: Error) => setError(reason.message)) }, [])

	return <section>
		<PageIntro eyebrow="Learning areas" title="Topics" description="Choose an area and follow your curiosity." />
		{error ? <div className="empty-state">{error}</div> : <div className="topic-grid">{topics.map((topic) => <Link className="large-topic-card" to={`/topics/${topic.id}`} key={topic.id}><span className="topic-icon violet"><BookOpen size={20} /></span><h2>{topic.name}</h2><p>{topic.solved} / {topic.total} solved · {topic.description ?? 'Questions to explore'}</p><span className="card-arrow"><ChevronRight size={17} /></span></Link>)}</div>}
		{!error && topics.length === 0 && <div className="empty-state">No topics are available yet.</div>}
	</section>
}
