import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { questions } from '@data/questions'
import { QuestionRow } from '@components/questions/QuestionRow'
import { PageIntro } from '@components/shared/PageIntro'

export function QuestionsPage() {
	const [search, setSearch] = useState('')
	const [type, setType] = useState('All types')
	const filteredQuestions = useMemo(
		() => questions.filter((question) => (
			(question.title.toLowerCase().includes(search.toLowerCase()) ||
				question.topic.toLowerCase().includes(search.toLowerCase())) &&
			(type === 'All types' || question.type === type)
		)),
		[search, type],
	)

	return (
		<section>
			<PageIntro eyebrow="Question bank" title="Questions" description="Build your understanding one question at a time." />
			<div className="toolbar">
				<label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or topics..." /></label>
				<select value={type} onChange={(event) => setType(event.target.value)}><option>All types</option><option>Single Choice</option><option>Math</option><option>AI</option></select>
			</div>
			<div className="question-list">{filteredQuestions.map((question) => <QuestionRow key={question.id} question={question} />)}</div>
			{filteredQuestions.length === 0 && <div className="empty-state">No questions match your search.</div>}
		</section>
	)
}
