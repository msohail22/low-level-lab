import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { questionSearchSchema } from '../../types'

// Every read-side page: Dashboard, Questions, Question detail, Topics, Topic detail, Progress,
// Analytics and Profile. The API is stubbed at the content-api boundary.

const api = {
	listQuestions: vi.fn(),
	listTopics: vi.fn(),
	getQuestion: vi.fn(),
	submitAnswer: vi.fn(),
	getRevisions: vi.fn(),
	restoreRevision: vi.fn(),
	getTopic: vi.fn(),
	getProgress: vi.fn(),
	getProgressHistory: vi.fn(),
}
vi.mock('@services/content-api', () => api)

type Session = { user: { name: string; email: string } } | null
const session: { data: Session; isPending: boolean } = { data: null, isPending: false }
vi.mock('@hooks/useAuth', () => ({ useAuth: () => session }))

const { DashboardPage } = await import('@pages/DashboardPage')
const { QuestionsPage } = await import('@pages/QuestionsPage')
const { QuestionDetailPage } = await import('@pages/QuestionDetailPage')
const { TopicsPage } = await import('@pages/TopicsPage')
const { TopicDetailPage } = await import('@pages/TopicDetailPage')
const { ProgressPage } = await import('@pages/ProgressPage')
const { AnalyticsPage } = await import('@pages/AnalyticsPage')
const { ProfilePage } = await import('@pages/ProfilePage')

function question(overrides: Record<string, unknown> = {}) {
	return {
		id: 'q1', slug: 'q1', title: 'Why does a linked list miss cache?', body: 'Think about **prefetch**.',
		type: 'single_choice', topicId: 'caches', difficulty: 'beginner', options: ['Pointer chasing', 'Arrays are shorter'],
		status: 'published', revision: 2, solved: false, ...overrides,
	}
}

function topic(overrides: Record<string, unknown> = {}) {
	return { id: 'caches', slug: 'caches', name: 'Caches', description: 'Lines and sets', total: 4, solved: 1, ...overrides }
}

function at(path: string, pattern: string, element: React.ReactNode) {
	return render(<MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={element} /></Routes></MemoryRouter>)
}

beforeEach(() => {
	vi.clearAllMocks()
	session.data = null
	session.isPending = false
	api.listQuestions.mockResolvedValue({ items: [], total: 0 })
	api.listTopics.mockResolvedValue([])
})

describe('DashboardPage', () => {
	it('shows loading until data arrives', async () => {
		api.listTopics.mockReturnValue(new Promise(() => {}))
		at('/', '/', <DashboardPage />)
		expect(screen.getByText('Loading dashboard…')).toBeInTheDocument()
	})

	it('asks for three questions and all topics', async () => {
		at('/', '/', <DashboardPage />)
		await waitFor(() => expect(api.listQuestions).toHaveBeenCalledWith({ pageSize: 3 }))
		expect(api.listTopics).toHaveBeenCalled()
	})

	it('adds up progress across topics', async () => {
		api.listTopics.mockResolvedValue([topic({ total: 6, solved: 3 }), topic({ id: 'mem', name: 'Memory', total: 4, solved: 0 })])
		at('/', '/', <DashboardPage />)
		expect(await screen.findByText('30%')).toBeInTheDocument()
		expect(screen.getByText('3/10')).toBeInTheDocument()
		expect(screen.getByText('1/2')).toBeInTheDocument()
		expect(screen.getByText('7')).toBeInTheDocument()
	})

	it('shows 0% rather than NaN for an empty bank', async () => {
		at('/', '/', <DashboardPage />)
		expect(await screen.findByText('0%')).toBeInTheDocument()
		expect(screen.getAllByText('0/0')).toHaveLength(2)
	})

	it('rounds the percentage', async () => {
		api.listTopics.mockResolvedValue([topic({ total: 3, solved: 2 })])
		at('/', '/', <DashboardPage />)
		expect(await screen.findByText('67%')).toBeInTheDocument()
	})

	it('shows empty states', async () => {
		at('/', '/', <DashboardPage />)
		expect(await screen.findByText('No questions are available yet.')).toBeInTheDocument()
		expect(screen.getByText('No topics are available yet.')).toBeInTheDocument()
	})

	it('lists at most three questions and three topics', async () => {
		api.listQuestions.mockResolvedValue({ items: [1, 2, 3, 4].map((n) => question({ id: `q${n}`, title: `Question ${n}` })), total: 4 })
		api.listTopics.mockResolvedValue([1, 2, 3, 4].map((n) => topic({ id: `t${n}`, name: `Topic ${n}` })))
		at('/', '/', <DashboardPage />)
		expect(await screen.findByText('Question 3')).toBeInTheDocument()
		expect(screen.queryByText('Question 4')).not.toBeInTheDocument()
		expect(screen.queryByText('Topic 4')).not.toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Topic 1/ })).toHaveAttribute('href', '/topics/t1')
	})

	it('shows the error message', async () => {
		api.listTopics.mockRejectedValue(new Error('Server unavailable'))
		at('/', '/', <DashboardPage />)
		expect(await screen.findByText('Server unavailable')).toBeInTheDocument()
		expect(screen.queryByText('Loading dashboard…')).not.toBeInTheDocument()
	})
})

describe('QuestionsPage', () => {
	it('loads the first page of ten after the debounce', async () => {
		at('/questions', '/questions', <QuestionsPage />)
		await waitFor(() => expect(api.listQuestions).toHaveBeenCalledWith({ search: '', type: '', status: '', topicId: '', page: 1, pageSize: 10 }))
	})

	it('shows the count and the rows', async () => {
		api.listQuestions.mockResolvedValue({ items: [question()], total: 1 })
		at('/questions', '/questions', <QuestionsPage />)
		expect(await screen.findByText('1 questions')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /linked list/ })).toHaveAttribute('href', '/questions/q1')
	})

	it('shows the empty state', async () => {
		at('/questions', '/questions', <QuestionsPage />)
		expect(await screen.findByText('No questions match your search.')).toBeInTheDocument()
	})

	it('shows the error and not the empty state', async () => {
		api.listQuestions.mockRejectedValue(new Error('Invalid search filters'))
		at('/questions', '/questions', <QuestionsPage />)
		expect(await screen.findByText('Invalid search filters')).toBeInTheDocument()
		expect(screen.queryByText('No questions match your search.')).not.toBeInTheDocument()
	})

	it('debounces typing into a single search request', async () => {
		at('/questions', '/questions', <QuestionsPage />)
		await waitFor(() => expect(api.listQuestions).toHaveBeenCalledTimes(1))
		await userEvent.type(screen.getByPlaceholderText('Search questions or topics...'), 'tlb')
		await waitFor(() => expect(api.listQuestions).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'tlb' })))
		expect(api.listQuestions).toHaveBeenCalledTimes(2)
	})

	it('offers the loaded topics as a filter', async () => {
		api.listTopics.mockResolvedValue([topic()])
		at('/questions', '/questions', <QuestionsPage />)
		expect(await screen.findByRole('option', { name: 'Caches' })).toHaveValue('caches')
	})

	it('survives a failed topic load', async () => {
		api.listTopics.mockRejectedValue(new Error('down'))
		at('/questions', '/questions', <QuestionsPage />)
		expect(await screen.findByRole('option', { name: 'All topics' })).toBeInTheDocument()
	})

	it('filters by type', async () => {
		at('/questions', '/questions', <QuestionsPage />)
		const [, typeSelect] = screen.getAllByRole('combobox')
		await userEvent.selectOptions(typeSelect, 'math')
		await waitFor(() => expect(api.listQuestions).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'math', page: 1 })))
	})

	it('paginates and resets to page 1 on a new filter', async () => {
		api.listQuestions.mockResolvedValue({ items: [question()], total: 25 })
		at('/questions', '/questions', <QuestionsPage />)
		expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
		await userEvent.click(screen.getByRole('button', { name: 'Next' }))
		await userEvent.click(screen.getByRole('button', { name: 'Next' }))
		expect(await screen.findByText('Page 3 of 3')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
		await userEvent.type(screen.getByPlaceholderText('Search questions or topics...'), 'x')
		expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
	})

	it.each([[10, false], [11, true]])('shows pagination for %i results: %s', async (total, shown) => {
		api.listQuestions.mockResolvedValue({ items: [question()], total })
		at('/questions', '/questions', <QuestionsPage />)
		await screen.findByText(`${total} questions`)
		expect(screen.queryByRole('button', { name: 'Next' }) !== null).toBe(shown)
	})

	// KNOWN BUG: the status filter offers "solved" and "unsolved", but the server validates `status`
	// against the workflow statuses, so choosing either answers 400 "Invalid search filters".
	it.fails.each(['solved', 'unsolved'])('sends a status filter the server accepts: %s', (status) => {
		expect(questionSearchSchema.safeParse({ status }).success).toBe(true)
	})

	// KNOWN BUG: the topic page links to /questions?topicId=…, but this page never reads the query
	// string, so the list is not filtered.
	it.fails('honours ?topicId from the topic page link', async () => {
		at('/questions?topicId=caches', '/questions', <QuestionsPage />)
		await waitFor(() => expect(api.listQuestions).toHaveBeenCalledWith(expect.objectContaining({ topicId: 'caches' })))
	})
})

describe('QuestionDetailPage', () => {
	function open(q = question()) {
		api.getQuestion.mockResolvedValue(q)
		return at(`/questions/${q.id}`, '/questions/:questionId', <QuestionDetailPage />)
	}

	it('loads the question named in the URL', async () => {
		open()
		expect(await screen.findByRole('heading', { level: 1, name: /linked list/ })).toBeInTheDocument()
		expect(api.getQuestion).toHaveBeenCalledWith('q1')
	})

	it('shows loading, then error', async () => {
		api.getQuestion.mockRejectedValue(new Error('Question not found'))
		at('/questions/x', '/questions/:questionId', <QuestionDetailPage />)
		expect(screen.getByText('Loading question…')).toBeInTheDocument()
		expect(await screen.findByText('Question not found')).toBeInTheDocument()
	})

	it('shows type, topic and difficulty', async () => {
		open()
		await screen.findByRole('heading', { level: 1 })
		expect(screen.getByText('single_choice')).toBeInTheDocument()
		expect(screen.getByText('caches')).toBeInTheDocument()
		expect(screen.getByText('beginner')).toBeInTheDocument()
	})

	function markerOf(name: string | RegExp) {
		return screen.getByRole('button', { name }).querySelector('.option-marker')!.textContent
	}

	it('letters single-choice options A, B', async () => {
		open()
		await screen.findByRole('button', { name: /Pointer chasing/ })
		expect(markerOf(/Pointer chasing/)).toBe('A')
		expect(markerOf(/Arrays are shorter/)).toBe('B')
	})

	it('keeps submit disabled until an option is chosen', async () => {
		open()
		const submit = await screen.findByRole('button', { name: /Submit answer/ })
		expect(submit).toBeDisabled()
		await userEvent.click(screen.getByRole('button', { name: /Pointer chasing/ }))
		expect(submit).toBeEnabled()
	})

	it('allows only one single-choice selection', async () => {
		open()
		await userEvent.click(await screen.findByRole('button', { name: /Pointer chasing/ }))
		await userEvent.click(screen.getByRole('button', { name: /Arrays are shorter/ }))
		expect(screen.getByRole('button', { name: /Arrays are shorter/ })).toHaveClass('selected')
		expect(screen.getByRole('button', { name: /Pointer chasing/ })).not.toHaveClass('selected')
	})

	it('submits a single choice as a string and shows the verdict', async () => {
		api.submitAnswer.mockResolvedValue({ correct: true, explanation: 'Pointers defeat the prefetcher.' })
		open()
		await userEvent.click(await screen.findByRole('button', { name: /Pointer chasing/ }))
		await userEvent.click(screen.getByRole('button', { name: /Submit answer/ }))
		expect(api.submitAnswer).toHaveBeenCalledWith('q1', 'Pointer chasing')
		expect(await screen.findByText('Correct — question solved.')).toBeInTheDocument()
		expect(screen.getByText('Pointers defeat the prefetcher.')).toBeInTheDocument()
	})

	it('shows a wrong answer without an explanation', async () => {
		api.submitAnswer.mockResolvedValue({ correct: false, explanation: null })
		open()
		await userEvent.click(await screen.findByRole('button', { name: /Arrays/ }))
		await userEvent.click(screen.getByRole('button', { name: /Submit answer/ }))
		expect(await screen.findByText('Not quite yet.')).toBeInTheDocument()
	})

	it('clears the verdict when the answer changes', async () => {
		api.submitAnswer.mockResolvedValue({ correct: false })
		open()
		await userEvent.click(await screen.findByRole('button', { name: /Arrays/ }))
		await userEvent.click(screen.getByRole('button', { name: /Submit answer/ }))
		await screen.findByText('Not quite yet.')
		await userEvent.click(screen.getByRole('button', { name: /Pointer chasing/ }))
		expect(screen.queryByText('Not quite yet.')).not.toBeInTheDocument()
	})

	it('toggles multiple-choice options and submits them as an array', async () => {
		api.submitAnswer.mockResolvedValue({ correct: true })
		open(question({ type: 'multiple_choice', options: ['a', 'b', 'c'] }))
		const a = await screen.findByRole('button', { name: /a$/ })
		expect(markerOf(/a$/)).toBe('')
		await userEvent.click(a)
		await userEvent.click(screen.getByRole('button', { name: /c$/ }))
		expect(screen.getByRole('button', { name: /a$/ })).toHaveClass('selected')
		expect(markerOf(/a$/)).toBe('✓')
		await userEvent.click(screen.getByRole('button', { name: /c$/ }))
		expect(screen.getByRole('button', { name: /c$/ })).not.toHaveClass('selected')
		await userEvent.click(screen.getByRole('button', { name: /Submit answer/ }))
		expect(api.submitAnswer).toHaveBeenCalledWith('q1', ['a'])
	})

	it('disables submit when every multiple-choice option is unticked again', async () => {
		open(question({ type: 'multiple_choice', options: ['a', 'b'] }))
		await userEvent.click(await screen.findByRole('button', { name: /a$/ }))
		await userEvent.click(screen.getByRole('button', { name: /a$/ }))
		expect(screen.getByRole('button', { name: /Submit answer/ })).toBeDisabled()
	})

	it('offers true and false for a true/false question regardless of stored options', async () => {
		open(question({ type: 'true_false', options: [] }))
		await screen.findByRole('button', { name: /true$/ })
		expect(markerOf(/true$/)).toBe('A')
		expect(markerOf(/false$/)).toBe('B')
	})

	it.each(['math', 'code_output'])('takes free text for %s', async (type) => {
		api.submitAnswer.mockResolvedValue({ correct: true })
		open(question({ type, options: [] }))
		const box = await screen.findByPlaceholderText('Type your answer…')
		expect(screen.getByRole('button', { name: /Submit answer/ })).toBeDisabled()
		await userEvent.type(box, '64')
		await userEvent.click(screen.getByRole('button', { name: /Submit answer/ }))
		expect(api.submitAnswer).toHaveBeenCalledWith('q1', '64')
	})

	it('shows the submit error', async () => {
		api.submitAnswer.mockRejectedValue(new Error('Sign in to submit an answer'))
		open()
		await userEvent.click(await screen.findByRole('button', { name: /Pointer chasing/ }))
		await userEvent.click(screen.getByRole('button', { name: /Submit answer/ }))
		expect(await screen.findByText('Sign in to submit an answer')).toBeInTheDocument()
	})

	it('links back to the question list', async () => {
		open()
		expect(await screen.findByRole('link', { name: '← Back to questions' })).toHaveAttribute('href', '/questions')
	})

	describe('revision history', () => {
		const revisions = [
			{ ...question(), revision: 1, createdAt: '2026-01-01T00:00:00Z' },
			{ ...question(), revision: 2, createdAt: '2026-02-01T00:00:00Z' },
		]

		it('lists revisions and marks the current one', async () => {
			api.getRevisions.mockResolvedValue(revisions)
			open()
			await userEvent.click(await screen.findByRole('button', { name: 'View revision history' }))
			expect(await screen.findByRole('heading', { name: 'Revision history' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Current' })).toBeDisabled()
			expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled()
		})

		it('shows an empty list', async () => {
			api.getRevisions.mockResolvedValue([])
			open()
			await userEvent.click(await screen.findByRole('button', { name: 'View revision history' }))
			expect(await screen.findByText('No revisions are available.')).toBeInTheDocument()
		})

		it('restores a revision and closes the list', async () => {
			api.getRevisions.mockResolvedValue(revisions)
			api.restoreRevision.mockResolvedValue(question({ title: 'Restored title', revision: 3 }))
			open()
			await userEvent.click(await screen.findByRole('button', { name: 'View revision history' }))
			await userEvent.click(await screen.findByRole('button', { name: 'Restore' }))
			expect(api.restoreRevision).toHaveBeenCalledWith('q1', 1)
			expect(await screen.findByRole('heading', { level: 1, name: 'Restored title' })).toBeInTheDocument()
			expect(screen.queryByRole('heading', { name: 'Revision history' })).not.toBeInTheDocument()
		})

		it('shows a 403 from revisions as the page error', async () => {
			api.getRevisions.mockRejectedValue(new Error('Question permission required'))
			open()
			await userEvent.click(await screen.findByRole('button', { name: 'View revision history' }))
			expect(await screen.findByText('Question permission required')).toBeInTheDocument()
		})

		it('shows a restore failure', async () => {
			api.getRevisions.mockResolvedValue(revisions)
			api.restoreRevision.mockRejectedValue(new Error('Revision not found'))
			open()
			await userEvent.click(await screen.findByRole('button', { name: 'View revision history' }))
			await userEvent.click(await screen.findByRole('button', { name: 'Restore' }))
			expect(await screen.findByText('Revision not found')).toBeInTheDocument()
		})
	})
})

describe('TopicsPage', () => {
	it('shows loading, then topic cards', async () => {
		api.listTopics.mockResolvedValue([topic(), topic({ id: 'mem', name: 'Memory', description: null, solved: 0 })])
		at('/topics', '/topics', <TopicsPage />)
		expect(screen.getByText('Loading topics…')).toBeInTheDocument()
		expect(await screen.findByRole('heading', { name: 'Caches' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Caches/ })).toHaveAttribute('href', '/topics/caches')
		expect(screen.getByText('1 of 4 held up')).toBeInTheDocument()
		expect(screen.getByText('Questions to explore')).toBeInTheDocument()
	})

	it('shows an empty state', async () => {
		at('/topics', '/topics', <TopicsPage />)
		expect(await screen.findByText('No topics are available yet.')).toBeInTheDocument()
	})

	it('shows the error only', async () => {
		api.listTopics.mockRejectedValue(new Error('Server unavailable'))
		at('/topics', '/topics', <TopicsPage />)
		expect(await screen.findByText('Server unavailable')).toBeInTheDocument()
		expect(screen.queryByText('No topics are available yet.')).not.toBeInTheDocument()
	})
})

describe('TopicDetailPage', () => {
	function open(t: Record<string, unknown>) {
		api.getTopic.mockResolvedValue(t)
		return at('/topics/caches', '/topics/:topicId', <TopicDetailPage />)
	}

	it('loads the topic named in the URL', async () => {
		open(topic({ subtopics: [], questions: [] }))
		expect(await screen.findByRole('heading', { level: 1, name: 'Caches' })).toBeInTheDocument()
		expect(api.getTopic).toHaveBeenCalledWith('caches')
	})

	it('shows counts and lettered subtopics', async () => {
		open(topic({ total: 9, solved: 2, subtopics: ['TLB', 'Prefetching'], questions: [] }))
		await screen.findByRole('heading', { level: 1 })
		const stats = [...document.querySelectorAll('.stat-card strong')].map((node) => node.textContent)
		expect(stats).toEqual(['9', '2', '2'])
		const list = document.querySelector('.subtopic-list') as HTMLElement
		expect(within(list).getByText('TLB').parentElement).toHaveTextContent('a TLB')
		expect(within(list).getByText('Prefetching').parentElement).toHaveTextContent('b Prefetching')
	})

	it('falls back to the default description', async () => {
		open(topic({ description: null, subtopics: [], questions: [] }))
		expect(await screen.findByText('Explore questions in this learning area.')).toBeInTheDocument()
	})

	it('lists the topic questions', async () => {
		open(topic({ subtopics: [], questions: [question()] }))
		expect(await screen.findByRole('link', { name: /linked list/ })).toHaveAttribute('href', '/questions/q1')
		expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/questions?topicId=caches')
	})

	it('shows the error', async () => {
		api.getTopic.mockRejectedValue(new Error('Topic not found'))
		at('/topics/x', '/topics/:topicId', <TopicDetailPage />)
		expect(await screen.findByText('Topic not found')).toBeInTheDocument()
	})
})

describe('ProgressPage', () => {
	beforeEach(() => {
		api.getProgress.mockResolvedValue({ solved: 3, total: 12, topics: [{ topicId: 'caches', total: 8, solved: 2 }, { topicId: 'orphan', total: 4, solved: 1 }] })
		api.listTopics.mockResolvedValue([topic()])
		api.getProgressHistory.mockResolvedValue({ items: [] })
	})

	it('shows loading first', () => {
		at('/progress', '/progress', <ProgressPage />)
		expect(screen.getByText('Loading progress…')).toBeInTheDocument()
	})

	it('shows the overall figure and percentage', async () => {
		at('/progress', '/progress', <ProgressPage />)
		expect(await screen.findByText('You have completed 25% of the available questions.')).toBeInTheDocument()
		expect(screen.getByText('/ 12 solved')).toBeInTheDocument()
	})

	it('names topics and falls back to the id for unknown ones', async () => {
		at('/progress', '/progress', <ProgressPage />)
		expect(await screen.findByText('Caches')).toBeInTheDocument()
		expect(screen.getByText('orphan')).toBeInTheDocument()
		expect(screen.getByText('2 / 8 solved')).toBeInTheDocument()
	})

	it('sizes each topic bar by its share', async () => {
		const { container } = at('/progress', '/progress', <ProgressPage />)
		await screen.findByText('Caches')
		const bars = [...container.querySelectorAll('.mini-progress span')] as HTMLElement[]
		expect(bars.map((bar) => bar.style.width)).toEqual(['25%', '25%'])
	})

	it('handles a zero total without NaN', async () => {
		api.getProgress.mockResolvedValue({ solved: 0, total: 0, topics: [{ topicId: 'caches', total: 0, solved: 0 }] })
		const { container } = at('/progress', '/progress', <ProgressPage />)
		expect(await screen.findByText('You have completed 0% of the available questions.')).toBeInTheDocument()
		expect((container.querySelector('.mini-progress span') as HTMLElement).style.width).toBe('0%')
	})

	it('shows an empty history', async () => {
		at('/progress', '/progress', <ProgressPage />)
		expect(await screen.findByText('Your answered questions will appear here.')).toBeInTheDocument()
	})

	it('shows each attempt with its outcome', async () => {
		api.getProgressHistory.mockResolvedValue({ items: [
			{ id: 'a1', questionId: 'q1', questionTitle: 'Right one', correct: true, answer: 'x', createdAt: '2026-01-01T00:00:00Z' },
			{ id: 'a2', questionId: 'q2', questionTitle: 'Wrong one', correct: false, answer: 'y', createdAt: '2026-01-02T00:00:00Z' },
		] })
		at('/progress', '/progress', <ProgressPage />)
		expect(await screen.findByText('Right one')).toBeInTheDocument()
		expect(screen.getByText('Correct')).toHaveClass('history-correct')
		expect(screen.getByText('Try again')).toHaveClass('history-incorrect')
	})

	it('shows the error when any request fails', async () => {
		api.getProgressHistory.mockRejectedValue(new Error('Sign in to view progress'))
		at('/progress', '/progress', <ProgressPage />)
		expect(await screen.findByText('Sign in to view progress')).toBeInTheDocument()
	})
})

describe('AnalyticsPage', () => {
	it('counts published questions', async () => {
		api.listQuestions.mockResolvedValue({ items: [question(), question({ id: 'q2' }), question({ id: 'q3', status: 'draft' })], total: 3 })
		at('/analytics', '/analytics', <AnalyticsPage />)
		expect(await screen.findByText('2 published questions')).toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Daily reads trend chart' })).toBeInTheDocument()
	})

	it('shows loading then error', async () => {
		api.listQuestions.mockRejectedValue(new Error('Invalid search filters'))
		at('/analytics', '/analytics', <AnalyticsPage />)
		expect(screen.getByText('Loading analytics…')).toBeInTheDocument()
		expect(await screen.findByText('Invalid search filters')).toBeInTheDocument()
	})

	// KNOWN BUG: the page asks for pageSize 100, but the server caps pageSize at 50, so in
	// production this page always shows "Invalid search filters".
	it.fails('requests a page size the server accepts', async () => {
		at('/analytics', '/analytics', <AnalyticsPage />)
		await waitFor(() => expect(api.listQuestions).toHaveBeenCalled())
		expect(questionSearchSchema.safeParse(api.listQuestions.mock.calls[0][0]).success).toBe(true)
	})
})

describe('ProfilePage', () => {
	it('shows loading while pending', () => {
		session.isPending = true
		at('/profile', '/profile', <ProfilePage />)
		expect(screen.getByText('Loading profile…')).toBeInTheDocument()
	})

	it('invites a guest to sign in', () => {
		at('/profile', '/profile', <ProfilePage />)
		expect(screen.getByText('You are currently browsing as a guest.')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth')
	})

	it('shows the account details', () => {
		session.data = { user: { name: 'Ada Lovelace', email: 'ada@example.com' } }
		at('/profile', '/profile', <ProfilePage />)
		expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
		expect(screen.getByText('ada@example.com')).toBeInTheDocument()
		expect(screen.getByText('AL')).toBeInTheDocument()
		expect(screen.getByText('Active')).toBeInTheDocument()
	})
})
