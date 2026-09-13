import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { topics } from '@data/topics'
import { PageIntro } from '@components/shared/PageIntro'

export function TopicsPage() {
	return (
		<section>
			<PageIntro eyebrow="Learning areas" title="Topics" description="Choose an area and follow your curiosity." />
			<div className="topic-grid">{topics.map(({ name, count, icon: Icon, color }) => <Link className="large-topic-card" to="/questions" key={name}><span className={`topic-icon ${color}`}><Icon size={20} /></span><h2>{name}</h2><p>{count} questions to explore</p><span className="card-arrow"><ChevronRight size={17} /></span></Link>)}</div>
		</section>
	)
}
