import { useMemo, useState } from 'react'
import {
	BookOpen,
	CheckCircle2,
	ChevronRight,
	CircleHelp,
	Code2,
	LayoutDashboard,
	Menu,
	Moon,
	PanelLeft,
	Search,
	Sparkles,
	Sun,
	Target,
	X,
} from 'lucide-react'
import {
	BrowserRouter,
	Link,
	Navigate,
	Route,
	Routes,
	useLocation,
} from 'react-router-dom'

import { AuthPage } from '@pages/AuthPage'

type QuestionType = 'Single Choice' | 'Math' | 'AI'

type Question = {
	id: number
	title: string
	topic: string
	type: QuestionType
	difficulty: 'Beginner' | 'Intermediate'
	description: string
	options: string[]
}

const questions: Question[] = [
	{
		id: 1,
		title: 'What does a closure preserve in JavaScript?',
		topic: 'JavaScript',
		type: 'Single Choice',
		difficulty: 'Beginner',
		description: 'Choose the best explanation for how closures work.',
		options: [
			'The lexical environment where a function was created',
			'Only the function return value',
			'The browser history',
			'The current HTML document',
		],
	},
	{
		id: 2,
		title: 'Calculate the time complexity of binary search.',
		topic: 'Mathematics',
		type: 'Math',
		difficulty: 'Beginner',
		description: 'What is the worst-case time complexity of binary search?',
		options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
	},
	{
		id: 3,
		title: 'What is the purpose of a validation set in machine learning?',
		topic: 'Artificial Intelligence',
		type: 'AI',
		difficulty: 'Intermediate',
		description: 'Select the primary purpose of holding out validation data.',
		options: [
			'To tune model choices before final evaluation',
			'To replace the training data',
			'To guarantee perfect predictions',
			'To encrypt the dataset',
		],
	},
	{
		id: 4,
		title: 'Why does a process need virtual memory?',
		topic: 'Operating Systems',
		type: 'Single Choice',
		difficulty: 'Intermediate',
		description: 'Choose the best description of virtual memory.',
		options: [
			'To give each process an isolated address space',
			'To remove the need for a CPU',
			'To store passwords in plain text',
			'To increase monitor resolution',
		],
	},
]

const topics = [
	{ name: 'JavaScript', count: 24, icon: Code2, color: 'amber' },
	{ name: 'Operating Systems', count: 18, icon: PanelLeft, color: 'violet' },
	{ name: 'Mathematics', count: 16, icon: Target, color: 'blue' },
	{ name: 'Artificial Intelligence', count: 12, icon: Sparkles, color: 'pink' },
]

function AppShell() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [darkMode, setDarkMode] = useState(false)
	const location = useLocation()

	const pageTitle =
		location.pathname === '/questions'
			? 'Questions'
			: location.pathname === '/topics'
				? 'Topics'
				: location.pathname === '/progress'
					? 'Progress'
					: 'Dashboard'

	const navItems = [
		{ label: 'Dashboard', path: '/', icon: LayoutDashboard },
		{ label: 'Questions', path: '/questions', icon: CircleHelp },
		{ label: 'Topics', path: '/topics', icon: BookOpen },
		{ label: 'Progress', path: '/progress', icon: Target },
	]

	return (
		<div className={`app-shell ${darkMode ? 'dark' : ''}`}>
			<aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
				<div className="brand">
					<div className="brand-mark">L</div>
					<div>
						<strong>Low Level Lab</strong>
						<span>Learn by understanding</span>
					</div>
					<button className="icon-button close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
						<X size={18} />
					</button>
				</div>
				<nav className="main-nav" aria-label="Main navigation">
					<span className="nav-label">Workspace</span>
					{navItems.map(({ label, path, icon: Icon }) => (
						<Link
							className={`nav-item ${location.pathname === path ? 'active' : ''}`}
							key={path}
							onClick={() => setSidebarOpen(false)}
							to={path}
						>
							<Icon size={18} />
							{label}
						</Link>
					))}
					<span className="nav-label nav-label-spaced">Coming soon</span>
					<div className="nav-item disabled"><Code2 size={18} />Coding Questions<span className="soon-pill">Soon</span></div>
				</nav>
				<div className="sidebar-footer">
					<div className="profile-chip"><div className="avatar">ML</div><div><strong>My Learning</strong><span>Guest workspace</span></div></div>
					<Link className="settings-link" to="/auth">Sign in to sync progress <ChevronRight size={15} /></Link>
				</div>
			</aside>
			{sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
			<div className="main-area">
				<header className="topbar">
					<button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
					<div><span className="breadcrumb">Low Level Lab /</span> <strong>{pageTitle}</strong></div>
					<div className="topbar-actions">
						<button className="icon-button" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle color theme">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
						<Link className="profile-avatar" to="/auth">ML</Link>
					</div>
				</header>
				<main className="page-content">
					<Routes>
						<Route path="/" element={<Dashboard />} />
						<Route path="/questions" element={<Questions />} />
						<Route path="/questions/:id" element={<QuestionDetail />} />
						<Route path="/topics" element={<Topics />} />
						<Route path="/progress" element={<Progress />} />
						<Route path="/auth" element={<AuthPage />} />
						<Route path="/reset-password" element={<AuthPage />} />
						<Route path="*" element={<Navigate replace to="/" />} />
					</Routes>
				</main>
			</div>
		</div>
	)
}

function Dashboard() {
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

function Questions() {
	const [search, setSearch] = useState('')
	const [type, setType] = useState('All types')
	const filteredQuestions = useMemo(() => questions.filter((question) => (question.title.toLowerCase().includes(search.toLowerCase()) || question.topic.toLowerCase().includes(search.toLowerCase())) && (type === 'All types' || question.type === type)), [search, type])
	return <section><PageIntro eyebrow="Question bank" title="Questions" description="Build your understanding one question at a time." /><div className="toolbar"><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or topics..." /></label><select value={type} onChange={(event) => setType(event.target.value)}><option>All types</option><option>Single Choice</option><option>Math</option><option>AI</option></select></div><div className="question-list">{filteredQuestions.map((question) => <QuestionRow key={question.id} question={question} />)}</div>{filteredQuestions.length === 0 && <div className="empty-state">No questions match your search.</div>}</section>
}

function QuestionDetail() {
	const id = Number(useLocation().pathname.split('/').pop())
	const question = questions.find((item) => item.id === id) ?? questions[0]
	const [selected, setSelected] = useState('')
	const [submitted, setSubmitted] = useState(false)
	return <section className="detail-page"><Link className="back-link" to="/questions">← Back to questions</Link><div className="detail-card"><div className="question-meta"><span className="tag">{question.type}</span><span>{question.topic}</span><span>{question.difficulty}</span></div><h1>{question.title}</h1><p className="detail-description">{question.description}</p><div className="answer-options">{question.options.map((option) => <button className={`answer-option ${selected === option ? 'selected' : ''}`} key={option} onClick={() => { setSelected(option); setSubmitted(false) }}><span className="option-marker">{String.fromCharCode(65 + question.options.indexOf(option))}</span>{option}</button>)}</div><button className="primary-button" disabled={!selected} onClick={() => setSubmitted(true)}>Submit answer <ChevronRight size={17} /></button>{submitted && <div className="explanation"><CheckCircle2 size={20} /><div><strong>Nice work!</strong><p>This is a UI preview. Answer explanations and progress persistence will be connected in a later phase.</p></div></div>}</div></section>
}

function Topics() {
	return <section><PageIntro eyebrow="Learning areas" title="Topics" description="Choose an area and follow your curiosity." /><div className="topic-grid">{topics.map(({ name, count, icon: Icon, color }) => <Link className="large-topic-card" to="/questions" key={name}><span className={`topic-icon ${color}`}><Icon size={20} /></span><h2>{name}</h2><p>{count} questions to explore</p><span className="card-arrow"><ChevronRight size={17} /></span></Link>)}</div></section>
}

function Progress() {
	return <section><PageIntro eyebrow="Your learning" title="Progress" description="A simple view of what you have explored so far." /><div className="progress-overview"><div><span className="progress-number">12</span><span className="progress-total">/ 70 solved</span></div><div className="progress-track"><span style={{ width: '17%' }} /></div><p>You have completed 17% of the available questions.</p></div><div className="panel"><div className="panel-heading"><div><span className="eyebrow">By topic</span><h2>Keep exploring</h2></div></div>{topics.map(({ name, count }) => <div className="progress-row" key={name}><div><strong>{name}</strong><span>0 / {count} solved</span></div><div className="mini-progress"><span /></div></div>)}</div></section>
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
	return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
}

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof CheckCircle2 }) {
	return <div className="stat-card"><span className="stat-icon"><Icon size={19} /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>
}

function QuestionRow({ question }: { question: Question }) {
	return <Link className="question-row" to={`/questions/${question.id}`}><span className="question-status"><CircleHelp size={18} /></span><span className="question-copy"><strong>{question.title}</strong><small>{question.topic} · {question.type}</small></span><span className="difficulty">{question.difficulty}</span><ChevronRight size={17} /></Link>
}

export default function App() {
	return <BrowserRouter><AppShell /></BrowserRouter>
}
