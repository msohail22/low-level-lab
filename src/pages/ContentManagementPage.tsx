import { useMemo, useState } from 'react'
import { Archive, Plus, Save, Trash2 } from 'lucide-react'

import { questionInputSchema, topicInputSchema } from '@low-level-lab/shared/content'
import { questions as initialQuestions } from '@data/questions'
import { topics as initialTopics } from '@data/topics'
import { PageIntro } from '@components/shared/PageIntro'

type TopicDraft = { name: string; slug: string; description: string }
type QuestionDraft = {
	title: string
	slug: string
	body: string
	type: 'single_choice' | 'multiple_choice' | 'true_false' | 'math' | 'ai' | 'code_output'
	topicId: string
	difficulty: 'beginner' | 'intermediate' | 'advanced'
	options: string
	correctAnswer: string
	explanation: string
}

const emptyTopic: TopicDraft = { name: '', slug: '', description: '' }
const emptyQuestion: QuestionDraft = {
	title: '', slug: '', body: '', type: 'single_choice', topicId: '', difficulty: 'beginner',
	options: '', correctAnswer: '', explanation: '',
}

export function ContentManagementPage() {
	const [section, setSection] = useState<'questions' | 'topics'>('questions')
	const [topicDraft, setTopicDraft] = useState(emptyTopic)
	const [questionDraft, setQuestionDraft] = useState(emptyQuestion)
	const [notice, setNotice] = useState('')
	const [topicCount, setTopicCount] = useState(initialTopics.length)
	const [questionCount, setQuestionCount] = useState(initialQuestions.length)

	const topicOptions = useMemo(() => initialTopics.slice(0, topicCount), [topicCount])

	function saveTopic() {
		const result = topicInputSchema.safeParse({ ...topicDraft, description: topicDraft.description || null })
		if (!result.success) {
			setNotice(result.error.issues[0]?.message ?? 'Check the topic fields.')
			return
		}
		setTopicCount((count) => count + 1)
		setTopicDraft(emptyTopic)
		setNotice('Topic draft saved locally. API persistence will be connected next.')
	}

	function saveQuestion() {
		const result = questionInputSchema.safeParse({
			...questionDraft,
			options: questionDraft.options.split('\n').map((option) => option.trim()).filter(Boolean),
			explanation: questionDraft.explanation || null,
		})
		if (!result.success) {
			setNotice(result.error.issues[0]?.message ?? 'Check the question fields.')
			return
		}
		setQuestionCount((count) => count + 1)
		setQuestionDraft(emptyQuestion)
		setNotice('Question draft saved locally. API persistence will be connected next.')
	}

	return (
		<section>
			<PageIntro eyebrow="Content workspace" title="Manage content" description="Create and refine draft topics and questions before moderation." />
			<div className="management-tabs">
				<button className={section === 'questions' ? 'active' : ''} onClick={() => setSection('questions')}>Questions ({questionCount})</button>
				<button className={section === 'topics' ? 'active' : ''} onClick={() => setSection('topics')}>Topics ({topicCount})</button>
			</div>
			<div className="management-grid">
				<div className="panel management-list">
					<div className="panel-heading"><div><span className="eyebrow">Draft workspace</span><h2>{section === 'questions' ? 'Question drafts' : 'Topic drafts'}</h2></div><span className="draft-badge">Draft</span></div>
					{section === 'questions'
						? initialQuestions.map((item) => <ManagementRow key={item.id} title={item.title} detail={`${item.topic} · ${item.type}`} />)
						: initialTopics.map((item) => <ManagementRow key={item.name} title={item.name} detail={`${item.count} questions`} />)}
				</div>
				<div className="panel management-form">
					<div className="panel-heading"><div><span className="eyebrow">Create draft</span><h2>New {section === 'questions' ? 'question' : 'topic'}</h2></div></div>
					{section === 'topics' ? <TopicForm value={topicDraft} onChange={setTopicDraft} onSave={saveTopic} /> : <QuestionForm value={questionDraft} topics={topicOptions} onChange={setQuestionDraft} onSave={saveQuestion} />}
					{notice && <p className="form-notice">{notice}</p>}
				</div>
			</div>
		</section>
	)
}

function ManagementRow({ title, detail }: { title: string; detail: string }) {
	return <div className="management-row"><span><strong>{title}</strong><small>{detail}</small></span><span className="row-actions"><button aria-label="Archive draft"><Archive size={15} /></button><button aria-label="Delete draft"><Trash2 size={15} /></button></span></div>
}

function TopicForm({ value, onChange, onSave }: { value: TopicDraft; onChange: (value: TopicDraft) => void; onSave: () => void }) {
	return <form className="content-form" onSubmit={(event) => { event.preventDefault(); onSave() }}><label>Name<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} placeholder="e.g. Networking" /></label><label>Slug<input value={value.slug} onChange={(event) => onChange({ ...value, slug: event.target.value })} placeholder="networking" /></label><label>Description<textarea value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} placeholder="What will learners explore?" /></label><button className="primary-button" type="submit"><Save size={16} /> Save topic draft</button></form>
}

function QuestionForm({ value, topics, onChange, onSave }: { value: QuestionDraft; topics: typeof initialTopics; onChange: (value: QuestionDraft) => void; onSave: () => void }) {
	return <form className="content-form" onSubmit={(event) => { event.preventDefault(); onSave() }}><label>Title<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="Question title" /></label><label>Slug<input value={value.slug} onChange={(event) => onChange({ ...value, slug: event.target.value })} placeholder="question-slug" /></label><label>Body<textarea value={value.body} onChange={(event) => onChange({ ...value, body: event.target.value })} placeholder="Question prompt or explanation..." /></label><div className="form-row"><label>Type<select value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as QuestionDraft['type'] })}><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option><option value="math">Math</option><option value="ai">AI</option><option value="code_output">Code output</option></select></label><label>Difficulty<select value={value.difficulty} onChange={(event) => onChange({ ...value, difficulty: event.target.value as QuestionDraft['difficulty'] })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div><label>Topic<select value={value.topicId} onChange={(event) => onChange({ ...value, topicId: event.target.value })}><option value="">Select a topic</option>{topics.map((topic) => <option key={topic.name} value={topic.name.toLowerCase().replaceAll(' ', '-')}>{topic.name}</option>)}</select></label><label>Options <small>(one per line)</small><textarea value={value.options} onChange={(event) => onChange({ ...value, options: event.target.value })} placeholder={'Option one\nOption two'} /></label><label>Correct answer<input value={value.correctAnswer} onChange={(event) => onChange({ ...value, correctAnswer: event.target.value })} placeholder="Exact answer" /></label><label>Explanation<textarea value={value.explanation} onChange={(event) => onChange({ ...value, explanation: event.target.value })} placeholder="Explain the answer..." /></label><button className="primary-button" type="submit"><Plus size={16} /> Save question draft</button></form>
}
