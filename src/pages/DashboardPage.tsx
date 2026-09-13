import { BookOpen, CheckCircle2, ChevronRight, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import { questions } from '@data/questions'
import { topics } from '@data/topics'
import { QuestionRow } from '@components/questions/QuestionRow'
import { StatCard } from '@components/shared/StatCard'

export function DashboardPage() {
	return (
		<>
			<section className="hero">
				<div><span className="eyebrow">Tuesday, September 13</span><h1>Keep building your mental model.</h1><p>Explore focused questions and strengthen your understanding of how things work.</p></div>
				<div className="hero-art"><Sparkles size={24} /><span>Small steps<br /><strong>compound.</strong></span></div>
			</section>
			<div className="stat-grid">
				<StatCard label="Questions solved" value="12" detail="of 70 available" icon={CheckCircle2} />
				<StatCard label="Current streak" value="4 days" detail="Keep it going" icon={Target} />
				<StatCard label="Topics explored" value="3" detail="of 8 topics" icon={BookOpen} />
			</div>
			<section className="content-grid">
				<div className="panel">
					<div className="panel-heading"><div><span className="eyebrow">Continue learning</span><h2>Pick up where you left off</h2></div><Link to="/questions" className="text-link">View all <ChevronRight size={15} /></Link></div>
					<div className="recent-list">{questions.slice(0, 3).map((question) => <QuestionRow key={question.id} question={question} />)}</div>
				</div>
				<div className="panel topic-panel">
					<div className="panel-heading"><div><span className="eyebrow">Explore</span><h2>Topics</h2></div><Link to="/topics" className="text-link">See all <ChevronRight size={15} /></Link></div>
					{topics.slice(0, 3).map(({ name, count, icon: Icon, color }) => <Link className="topic-row" to="/topics" key={name}><span className={`topic-icon ${color}`}><Icon size={17} /></span><span><strong>{name}</strong><small>{count} questions</small></span><ChevronRight size={16} /></Link>)}
				</div>
			</section>
		</>
	)
}
