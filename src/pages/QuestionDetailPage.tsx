import { useState } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { questions } from '@data/questions'

export function QuestionDetailPage() {
	const { questionId } = useParams()
	const question = questions.find((item) => item.id === Number(questionId)) ?? questions[0]
	const [selected, setSelected] = useState('')
	const [submitted, setSubmitted] = useState(false)

	return (
		<section className="detail-page">
			<Link className="back-link" to="/questions">← Back to questions</Link>
			<div className="detail-card">
				<div className="question-meta"><span className="tag">{question.type}</span><span>{question.topic}</span><span>{question.difficulty}</span></div>
				<h1>{question.title}</h1>
				<p className="detail-description">{question.description}</p>
				<div className="answer-options">
					{question.options.map((option, index) => (
						<button className={`answer-option ${selected === option ? 'selected' : ''}`} key={option} onClick={() => { setSelected(option); setSubmitted(false) }}>
							<span className="option-marker">{String.fromCharCode(65 + index)}</span>{option}
						</button>
					))}
				</div>
				<button className="primary-button" disabled={!selected} onClick={() => setSubmitted(true)}>Submit answer <ChevronRight size={17} /></button>
				{submitted && <div className="explanation"><CheckCircle2 size={20} /><div><strong>Nice work!</strong><p>This is a UI preview. Answer explanations and progress persistence will be connected in a later phase.</p></div></div>}
			</div>
		</section>
	)
}
