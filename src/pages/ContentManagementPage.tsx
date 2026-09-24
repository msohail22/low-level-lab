import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, Ellipsis, Plus, Save, Trash2, X } from 'lucide-react'

import { questionInputSchema, topicInputSchema } from '../../types'
import { PageIntro } from '@components/shared/PageIntro'
import { assignRole, createQuestion, createTopic, listModeration, listQuestions, listRoleTuples, listTopics, transitionQuestion, type ApiQuestion, type ApiTopic, type RoleTuple } from '@services/content-api'

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
	const [params] = useSearchParams()
	const [section, setSection] = useState<'questions' | 'topics' | 'reviewer' | 'admin' | 'super-admin'>((params.get('view') === 'review' ? 'reviewer' : params.get('view') === 'admin' ? 'admin' : params.get('view') === 'super-admin' ? 'super-admin' : params.get('view') === 'topics' ? 'topics' : 'questions'))
	const [topicDraft, setTopicDraft] = useState(emptyTopic)
	const [questionDraft, setQuestionDraft] = useState(emptyQuestion)
	const [notice, setNotice] = useState('')
	const [topics, setTopics] = useState<ApiTopic[]>([])
	const [questions, setQuestions] = useState<ApiQuestion[]>([])
	const [editing, setEditing] = useState<{ kind: 'topic' | 'question'; title: string } | null>(null)
	const [moderation, setModeration] = useState<ApiQuestion[]>([])
	const [roles, setRoles] = useState<RoleTuple[]>([])
	const [roleDraft, setRoleDraft] = useState({ userId: '', role: 'reviewer' })

	useEffect(() => {
		Promise.all([listTopics(), listQuestions({ manage: 1, pageSize: 50 })]).then(([nextTopics, nextQuestions]) => {
			setTopics(nextTopics)
			setQuestions(nextQuestions.items)
		}).catch((reason: Error) => setNotice(reason.message))
	}, [])

	useEffect(() => {
		if (section === 'reviewer' || section === 'admin') listModeration(section).then((result) => setModeration(result.items)).catch((reason: Error) => setNotice(reason.message))
		if (section === 'super-admin') listRoleTuples().then((result) => setRoles(result.items)).catch((reason: Error) => setNotice(reason.message))
	}, [section])

	async function applyWorkflow(id: string, action: string) {
		try {
			const updated = await transitionQuestion(id, action)
			setModeration((current) => current.map((item) => item.id === id ? updated : item).filter((item) => item.status !== 'published' && item.status !== 'approved'))
			setNotice(`Question ${action.replace('_', ' ')} successfully.`)
		} catch (reason) {
			setNotice(reason instanceof Error ? reason.message : 'Unable to update workflow.')
		}
	}

	async function saveRole() {
		try {
			const result = await assignRole(roleDraft)
			setRoles((current) => [...current, result.item])
			setRoleDraft({ userId: '', role: 'reviewer' })
			setNotice('Role assigned.')
		} catch (reason) {
			setNotice(reason instanceof Error ? reason.message : 'Unable to assign role.')
		}
	}

	async function saveTopic() {
		const result = topicInputSchema.safeParse({ ...topicDraft, description: topicDraft.description || null })
		if (!result.success) {
			setNotice(result.error.issues[0]?.message ?? 'Check the topic fields.')
			return
		}
		try {
			const created = await createTopic(result.data)
			setTopics((current) => [...current, created])
		} catch (reason) {
			setNotice(reason instanceof Error ? reason.message : 'Unable to save topic.')
			return
		}
		setTopicDraft(emptyTopic)
		setNotice('Topic draft saved.')
	}

	async function saveQuestion() {
		const result = questionInputSchema.safeParse({
			...questionDraft,
			options: questionDraft.options.split('\n').map((option) => option.trim()).filter(Boolean),
			correctAnswer: questionDraft.type === 'multiple_choice'
				? questionDraft.correctAnswer.split('\n').map((answer) => answer.trim()).filter(Boolean)
				: questionDraft.correctAnswer,
			explanation: questionDraft.explanation || null,
		})
		if (!result.success) {
			setNotice(result.error.issues[0]?.message ?? 'Check the question fields.')
			return
		}
		try {
			const created = await createQuestion(result.data)
			setQuestions((current) => [...current, created])
		} catch (reason) {
			setNotice(reason instanceof Error ? reason.message : 'Unable to save question.')
			return
		}
		setQuestionDraft(emptyQuestion)
		setNotice('Question draft saved.')
	}

	return (
		<section>
			<PageIntro eyebrow="Content workspace" title="Manage content" description="Create and refine draft topics and questions before moderation." />
			<div className="management-tabs">
				<button className={section === 'questions' ? 'active' : ''} onClick={() => setSection('questions')}>Questions ({questions.length})</button>
				<button className={section === 'topics' ? 'active' : ''} onClick={() => setSection('topics')}>Topics ({topics.length})</button>
				<button className={section === 'reviewer' ? 'active' : ''} onClick={() => setSection('reviewer')}>Reviewer queue</button>
				<button className={section === 'admin' ? 'active' : ''} onClick={() => setSection('admin')}>Admin queue</button>
				<button className={section === 'super-admin' ? 'active' : ''} onClick={() => setSection('super-admin')}>Roles</button>
			</div>
			{(section === 'reviewer' || section === 'admin') && <ModerationPanel items={moderation} queue={section} onAction={applyWorkflow} notice={notice} />}
			{section === 'super-admin' && <RolePanel roles={roles} draft={roleDraft} onDraft={setRoleDraft} onSave={saveRole} notice={notice} />}
			{(section === 'questions' || section === 'topics') && <div className="management-grid">
				<div className="panel management-list">
					<div className="panel-heading"><div><span className="eyebrow">Draft workspace</span><h2>{section === 'questions' ? 'Question drafts' : 'Topic drafts'}</h2></div><span className="draft-badge">Draft</span></div>
					{section === 'questions'
						? questions.map((item) => <ManagementRow key={item.id} title={item.title} detail={`${item.topicId} · ${item.type}`} onEdit={() => setEditing({ kind: 'question', title: item.title })} />)
						: topics.map((item) => <ManagementRow key={item.id} title={item.name} detail={`${item.total} questions`} onEdit={() => setEditing({ kind: 'topic', title: item.name })} />)}
				</div>
				<div className="panel management-form">
					<div className="panel-heading"><div><span className="eyebrow">Create draft</span><h2>New {section === 'questions' ? 'question' : 'topic'}</h2></div></div>
					{section === 'topics' ? <TopicForm value={topicDraft} onChange={setTopicDraft} onSave={saveTopic} /> : <QuestionForm value={questionDraft} topics={topics} onChange={setQuestionDraft} onSave={saveQuestion} />}
					{notice && <p className="form-notice">{notice}</p>}
				</div>
			</div>}
			{editing && <EditModal item={editing} onClose={() => setEditing(null)} />}
		</section>
	)
}

function ManagementRow({ title, detail, onEdit }: { title: string; detail: string; onEdit: () => void }) {
	return <div className="management-row"><span><strong>{title}</strong><small>{detail}</small></span><span className="row-actions"><button aria-label={`Open actions for ${title}`} onClick={onEdit}><Ellipsis size={17} /></button><button aria-label="Archive draft"><Archive size={15} /></button><button aria-label="Delete draft"><Trash2 size={15} /></button></span></div>
}

function EditModal({ item, onClose }: { item: { kind: 'topic' | 'question'; title: string }; onClose: () => void }) {
	const [title, setTitle] = useState(item.title)
	return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-heading"><div><span className="eyebrow">Edit draft</span><h2 id="edit-title">{item.kind === 'topic' ? 'Edit topic' : 'Edit question'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close edit dialog"><X size={18} /></button></div><form className="content-form" onSubmit={(event) => { event.preventDefault(); onClose() }}><label>{item.kind === 'topic' ? 'Topic name' : 'Question title'}<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>{item.kind === 'topic' ? <label>Description<textarea placeholder="Topic description" /></label> : <><label>Question body<textarea placeholder="Question prompt" /></label><label>Explanation<textarea placeholder="Answer explanation" /></label></>}<div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><Save size={16} /> Save changes</button></div></form></div></div>
}

function TopicForm({ value, onChange, onSave }: { value: TopicDraft; onChange: (value: TopicDraft) => void; onSave: () => void }) {
	return <form className="content-form" onSubmit={(event) => { event.preventDefault(); onSave() }}><label>Name<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} placeholder="e.g. Networking" /></label><label>Slug<input value={value.slug} onChange={(event) => onChange({ ...value, slug: event.target.value })} placeholder="networking" /></label><label>Description<textarea value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} placeholder="What will learners explore?" /></label><button className="primary-button" type="submit"><Save size={16} /> Save topic draft</button></form>
}

function QuestionForm({ value, topics, onChange, onSave }: { value: QuestionDraft; topics: ApiTopic[]; onChange: (value: QuestionDraft) => void; onSave: () => void }) {
	return <form className="content-form" onSubmit={(event) => { event.preventDefault(); onSave() }}><label>Title<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="Question title" /></label><label>Slug<input value={value.slug} onChange={(event) => onChange({ ...value, slug: event.target.value })} placeholder="question-slug" /></label><label>Body<textarea value={value.body} onChange={(event) => onChange({ ...value, body: event.target.value })} placeholder="Question prompt or explanation..." /></label><div className="form-row"><label>Type<select value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as QuestionDraft['type'] })}><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option><option value="math">Math</option><option value="ai">AI</option><option value="code_output">Code output</option></select></label><label>Difficulty<select value={value.difficulty} onChange={(event) => onChange({ ...value, difficulty: event.target.value as QuestionDraft['difficulty'] })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div><label>Topic<select value={value.topicId} onChange={(event) => onChange({ ...value, topicId: event.target.value })}><option value="">Select a topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label><label>Options <small>(one per line)</small><textarea value={value.options} onChange={(event) => onChange({ ...value, options: event.target.value })} placeholder={'Option one\nOption two'} /></label><label>Correct answer<input value={value.correctAnswer} onChange={(event) => onChange({ ...value, correctAnswer: event.target.value })} placeholder="Exact answer" /></label><label>Explanation<textarea value={value.explanation} onChange={(event) => onChange({ ...value, explanation: event.target.value })} placeholder="Explain the answer..." /></label><button className="primary-button" type="submit"><Plus size={16} /> Save question draft</button></form>
}

function ModerationPanel({ items, queue, onAction, notice }: { items: ApiQuestion[]; queue: 'reviewer' | 'admin'; onAction: (id: string, action: string) => void; notice: string }) {
	return <div className="panel moderation-panel"><div className="panel-heading"><div><span className="eyebrow">{queue === 'reviewer' ? 'Reviewer queue' : 'Admin queue'}</span><h2>{items.length ? `${items.length} questions waiting` : 'Queue is clear'}</h2></div></div>{items.length === 0 ? <div className="empty-state">There are no questions waiting for this queue.</div> : items.map((item) => <div className="moderation-row" key={item.id}><span><strong>{item.title}</strong><small>{item.status} · {item.type}</small></span><span className="row-actions">{queue === 'reviewer' && item.status === 'submitted' && <button className="secondary-button" onClick={() => onAction(item.id, 'start_review')}>Start review</button>}{queue === 'reviewer' && item.status === 'in_review' && <><button className="secondary-button" onClick={() => onAction(item.id, 'request_changes')}>Request changes</button><button className="secondary-button" onClick={() => onAction(item.id, 'reject')}>Reject</button></>}{queue === 'admin' && item.status === 'in_review' && <button className="primary-button" onClick={() => onAction(item.id, 'approve')}>Approve</button>}{queue === 'admin' && item.status === 'approved' && <button className="primary-button" onClick={() => onAction(item.id, 'publish')}>Publish</button>}</span></div>)}{notice && <p className="form-notice">{notice}</p>}</div>
}

function RolePanel({ roles, draft, onDraft, onSave, notice }: { roles: RoleTuple[]; draft: { userId: string; role: string }; onDraft: (value: { userId: string; role: string }) => void; onSave: () => void; notice: string }) {
	return <div className="management-grid"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">OpenFGA tuples</span><h2>Assigned roles</h2></div></div>{roles.length === 0 ? <div className="empty-state">No role assignments found.</div> : roles.map((tuple) => <div className="management-row" key={`${tuple.user}-${tuple.relation}-${tuple.object}`}><span><strong>{tuple.relation}</strong><small>{tuple.user} · {tuple.object}</small></span></div>)}</div><div className="panel"><div className="panel-heading"><div><span className="eyebrow">Super-admin</span><h2>Assign a role</h2></div></div><form className="content-form" onSubmit={(event) => { event.preventDefault(); onSave() }}><label>User ID<input required value={draft.userId} onChange={(event) => onDraft({ ...draft, userId: event.target.value })} placeholder="User ID from your auth system" /></label><label>Role<select value={draft.role} onChange={(event) => onDraft({ ...draft, role: event.target.value })}><option value="member">Member</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option><option value="super_admin">Super-admin</option></select></label><button className="primary-button" type="submit">Assign role</button></form>{notice && <p className="form-notice">{notice}</p>}</div></div>
}
