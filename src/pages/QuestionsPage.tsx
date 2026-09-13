import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { QuestionRow } from '@components/questions/QuestionRow'
import { PageIntro } from '@components/shared/PageIntro'
import { listQuestions, listTopics, type ApiQuestion, type ApiTopic } from '@services/content-api'

export function QuestionsPage() {
	const [search, setSearch] = useState('')
	const [type, setType] = useState('')
	const [status, setStatus] = useState('')
	const [topicId, setTopicId] = useState('')
	const [page, setPage] = useState(1)
	const [data, setData] = useState<{ items: ApiQuestion[]; total: number }>({ items: [], total: 0 })
	const [topics, setTopics] = useState<ApiTopic[]>([])
	const [error, setError] = useState('')

	useEffect(() => { listTopics().then(setTopics).catch(() => setTopics([])) }, [])
	useEffect(() => {
		const timeout = window.setTimeout(() => {
			listQuestions({ search, type, status, topicId, page, pageSize: 10 })
				.then(setData)
				.catch((reason: Error) => setError(reason.message))
		}, 250)
		return () => window.clearTimeout(timeout)
	}, [search, type, status, topicId, page])

	return (
		<section>
			<PageIntro eyebrow="Question bank" title="Questions" description="Build your understanding one question at a time." />
			<div className="toolbar">
				<label className="search-box"><Search size={17} /><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search questions or topics..." /></label>
				<select value={topicId} onChange={(event) => { setPage(1); setTopicId(event.target.value) }}><option value="">All topics</option>{topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.name}</option>)}</select>
				<select value={type} onChange={(event) => { setPage(1); setType(event.target.value) }}><option value="">All types</option><option value="single_choice">Single Choice</option><option value="multiple_choice">Multiple Choice</option><option value="true_false">True / False</option><option value="math">Math</option><option value="ai">AI</option><option value="code_output">Code Output</option></select>
				<select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }}><option value="">All status</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select>
			</div>
			<p className="result-count">{data.total} questions</p>
			{error ? <div className="empty-state">{error}</div> : <div className="question-list">{data.items.map((question) => <QuestionRow key={question.id} question={question} />)}</div>}
			{!error && data.items.length === 0 && <div className="empty-state">No questions match your search.</div>}
			{data.total > 10 && <div className="pagination"><button className="secondary-button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(data.total / 10)}</span><button className="secondary-button" disabled={page >= Math.ceil(data.total / 10)} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
			<div className="coming-soon"><strong>Coding Questions</strong><span>Coming soon — a secure execution environment is still being designed.</span></div>
		</section>
	)
}
