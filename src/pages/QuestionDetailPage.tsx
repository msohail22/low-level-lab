import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getQuestion, submitAnswer, type ApiQuestion } from '@services/content-api'

export function QuestionDetailPage() {
	const { questionId = '' } = useParams()
	const [question, setQuestion] = useState<ApiQuestion | null>(null)
	const [selected, setSelected] = useState<string[]>([])
	const [textAnswer, setTextAnswer] = useState('')
	const [result, setResult] = useState<{ correct: boolean; explanation?: string | null } | null>(null)
	const [error, setError] = useState('')

	useEffect(() => {
		getQuestion(questionId).then(setQuestion).catch((reason: Error) => setError(reason.message))
	}, [questionId])

	if (error) return <div className="empty-state">{error}</div>
	if (!question) return <div className="empty-state">Loading question…</div>

	const options = question.type === 'true_false' ? ['true', 'false'] : question.options
	const choiceType = ['single_choice', 'multiple_choice', 'true_false', 'ai'].includes(question.type)
	const answer = choiceType ? (question.type === 'multiple_choice' ? selected : selected[0] ?? '') : textAnswer
	const submit = () => submitAnswer(question.id, answer).then(setResult).catch((reason: Error) => setError(reason.message))

	return (
		<section className="detail-page">
			<Link className="back-link" to="/questions">← Back to questions</Link>
			<div className="detail-card">
				<div className="question-meta"><span className="tag">{question.type}</span><span>{question.topicId}</span><span>{question.difficulty}</span></div>
				<h1>{question.title}</h1>
				<p className="detail-description">{question.body}</p>
				{choiceType
					? <div className="answer-options">{options.map((option, index) => {
						const active = selected.includes(option)
						return <button className={`answer-option ${active ? 'selected' : ''}`} key={option} onClick={() => {
							setResult(null)
							setSelected((current) => question.type === 'multiple_choice'
								? active ? current.filter((item) => item !== option) : [...current, option]
								: [option])
						}}><span className="option-marker">{question.type === 'multiple_choice' ? (active ? '✓' : '') : String.fromCharCode(65 + index)}</span>{option}</button>
					})}</div>
					: <textarea className="answer-input" value={textAnswer} onChange={(event) => { setTextAnswer(event.target.value); setResult(null) }} placeholder="Type your answer…" />}
				<button className="primary-button" disabled={!answer || (Array.isArray(answer) && answer.length === 0)} onClick={submit}>Submit answer <ChevronRight size={17} /></button>
				{result && <div className={`explanation ${result.correct ? '' : 'incorrect'}`}>{result.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<div><strong>{result.correct ? 'Correct — question solved.' : 'Not quite yet.'}</strong>{result.explanation && <p>{result.explanation}</p>}</div></div>}
			</div>
		</section>
	)
}
