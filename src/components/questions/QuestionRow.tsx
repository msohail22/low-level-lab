import { CheckCircle2, ChevronRight, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'

type QuestionRowData = { id: string | number; title: string; type: string; difficulty: string; topicId?: string; topic?: string; solved?: boolean }

export function QuestionRow({ question }: { question: QuestionRowData }) {
	return (
		<Link className="question-row" to={`/questions/${question.id}`}>
			<span className="question-status">{question.solved ? <CheckCircle2 size={18} /> : <CircleHelp size={18} />}</span>
			<span className="question-copy">
				<strong>{question.title}</strong>
				<small>{(question.topic ?? question.topicId ?? 'Topic')} — {question.type.replace(/_/g, ' ')}</small>
			</span>
			<span className={`difficulty ${question.solved ? 'is-solved' : question.difficulty === 'advanced' ? 'is-advanced' : ''}`}>
				{question.solved ? 'Held up' : question.difficulty}
			</span>
			<ChevronRight size={17} />
		</Link>
	)
}
