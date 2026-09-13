import { ChevronRight, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Question } from '@data/questions'

export function QuestionRow({ question }: { question: Question }) {
	return (
		<Link className="question-row" to={`/questions/${question.id}`}>
			<span className="question-status"><CircleHelp size={18} /></span>
			<span className="question-copy">
				<strong>{question.title}</strong>
				<small>{question.topic} · {question.type}</small>
			</span>
			<span className="difficulty">{question.difficulty}</span>
			<ChevronRight size={17} />
		</Link>
	)
}
