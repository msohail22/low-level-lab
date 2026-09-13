import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getQuestion, getRevisions, restoreRevision, submitAnswer, type ApiQuestion } from '@services/content-api'
import { MarkdownContent } from '@components/shared/MarkdownContent'

export function QuestionDetailPage() {
	const { questionId = '' } = useParams()
	const [question, setQuestion] = useState<ApiQuestion | null>(null)
	const [selected, setSelected] = useState<string[]>([])
	const [textAnswer, setTextAnswer] = useState('')
	const [result, setResult] = useState<{ correct: boolean; explanation?: string | null } | null>(null)
	const [error, setError] = useState('')
	const [revisions, setRevisions] = useState<Array<ApiQuestion & { revision: number; createdAt: string }>>([])
	const [showRevisions, setShowRevisions] = useState(false)
	const [restoring, setRestoring] = useState<number | null>(null)

	useEffect(() => {
		getQuestion(questionId).then(setQuestion).catch((reason: Error) => setError(reason.message))
	}, [questionId])

	async function loadRevisions() {
		try {
			setRevisions(await getRevisions(questionId))
			setShowRevisions(true)
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to load revisions.')
		}
	}

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
				<MarkdownContent content={question.body} />
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
				<button className="secondary-button revision-button" onClick={loadRevisions}>View revision history</button>
				{result && <div className={`explanation ${result.correct ? '' : 'incorrect'}`}>{result.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<div><strong>{result.correct ? 'Correct — question solved.' : 'Not quite yet.'}</strong>{result.explanation && <p>{result.explanation}</p>}</div></div>}
				{showRevisions && <div className="revision-list"><h2>Revision history</h2>{revisions.length === 0 ? <p className="empty-state">No revisions are available.</p> : revisions.map((revision) => <div className="revision-row" key={revision.revision}><span><strong>Revision {revision.revision}</strong><small>{new Date(revision.createdAt).toLocaleString()}</small></span><button className="secondary-button" disabled={restoring !== null || revision.revision === question.revision} onClick={async () => { setRestoring(revision.revision); try { const restored = await restoreRevision(question.id, revision.revision); setQuestion(restored); setShowRevisions(false) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to restore revision.') } finally { setRestoring(null) } }}>{revision.revision === question.revision ? 'Current' : restoring === revision.revision ? 'Restoring…' : 'Restore'}</button></div>)}</div>}
			</div>
		</section>
	)
}
