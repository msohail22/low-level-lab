import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = {
	listTopics: vi.fn(),
	listQuestions: vi.fn(),
	listModeration: vi.fn(),
	listRoleTuples: vi.fn(),
	transitionQuestion: vi.fn(),
	assignRole: vi.fn(),
	createTopic: vi.fn(),
	createQuestion: vi.fn(),
}
vi.mock('@services/content-api', () => api)

const { ContentManagementPage } = await import('@pages/ContentManagementPage')

const caches = { id: 'caches', slug: 'caches', name: 'Caches', total: 3, solved: 0 }
function q(overrides: Record<string, unknown> = {}) {
	return { id: 'q1', slug: 'q1', title: 'Cache line size', body: 'b', type: 'single_choice', topicId: 'caches', difficulty: 'beginner', options: [], status: 'draft', ...overrides }
}

function open(view?: string) {
	return render(<MemoryRouter initialEntries={[view ? `/manage?view=${view}` : '/manage']}><ContentManagementPage /></MemoryRouter>)
}

function tab(name: RegExp) {
	return screen.getByRole('button', { name })
}

beforeEach(() => {
	vi.clearAllMocks()
	api.listTopics.mockResolvedValue([caches])
	api.listQuestions.mockResolvedValue({ items: [q()], total: 1 })
	api.listModeration.mockResolvedValue({ items: [], total: 0 })
	api.listRoleTuples.mockResolvedValue({ items: [] })
})

describe('initial load', () => {
	it('loads topics and the management question list', async () => {
		open()
		expect(await screen.findByRole('button', { name: 'Questions (1)' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Topics (1)' })).toBeInTheDocument()
		expect(api.listQuestions).toHaveBeenCalledWith({ manage: 1, pageSize: 50 })
	})

	it('shows a load failure as a notice', async () => {
		api.listQuestions.mockRejectedValue(new Error('Question management permission required'))
		open()
		expect(await screen.findByText('Question management permission required')).toBeInTheDocument()
	})

	it.each([
		[undefined, 'Question drafts'],
		['submit', 'Question drafts'],
		['topics', 'Topic drafts'],
		['nonsense', 'Question drafts'],
	])('?view=%s opens %s', async (view, heading) => {
		open(view)
		expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
	})

	it.each([['review', 'reviewer'], ['admin', 'admin']])('?view=%s opens the %s queue', async (view, queue) => {
		open(view)
		await waitFor(() => expect(api.listModeration).toHaveBeenCalledWith(queue))
	})

	it('?view=super-admin opens the roles panel', async () => {
		open('super-admin')
		expect(await screen.findByRole('heading', { name: 'Assign a role' })).toBeInTheDocument()
		expect(api.listRoleTuples).toHaveBeenCalled()
	})

	it('marks the active tab', async () => {
		open('topics')
		expect(await screen.findByRole('button', { name: /^Topics/ })).toHaveClass('active')
		expect(tab(/^Questions/)).not.toHaveClass('active')
	})
})

describe('question drafts', () => {
	async function fill(values: Partial<Record<'Title' | 'Slug' | 'Body' | 'Options' | 'Correct answer', string>>) {
		for (const [label, value] of Object.entries(values)) {
			const field = screen.getByLabelText(new RegExp(`^${label}`))
			await userEvent.clear(field)
			await userEvent.type(field, value)
		}
	}

	it('lists existing drafts with topic and readable type', async () => {
		api.listQuestions.mockResolvedValue({ items: [q({ type: 'multiple_choice' })], total: 1 })
		open()
		expect(await screen.findByText('Cache line size')).toBeInTheDocument()
		expect(screen.getByText('caches — multiple choice')).toBeInTheDocument()
	})

	it('offers loaded topics in the form', async () => {
		open()
		expect(await screen.findByRole('option', { name: 'Caches' })).toHaveValue('caches')
	})

	it('shows the first validation message and does not call the API', async () => {
		open()
		await screen.findByRole('heading', { name: 'Question drafts' })
		await userEvent.click(screen.getByRole('button', { name: /Save question draft/ }))
		expect(document.querySelector('.form-notice')).not.toBeEmptyDOMElement()
		expect(api.createQuestion).not.toHaveBeenCalled()
	})

	it('saves a valid single-choice question, splitting options by line', async () => {
		api.createQuestion.mockResolvedValue(q({ id: 'q2', title: 'New question' }))
		open()
		await screen.findByRole('option', { name: 'Caches' })
		await fill({ Title: 'New question', Slug: 'new-question', Body: 'Prompt', Options: 'First\n  Second  \n\n', 'Correct answer': 'First' })
		await userEvent.selectOptions(screen.getByLabelText('Topic'), 'caches')
		await userEvent.click(screen.getByRole('button', { name: /Save question draft/ }))
		await waitFor(() => expect(api.createQuestion).toHaveBeenCalled())
		expect(api.createQuestion.mock.calls[0][0]).toMatchObject({
			title: 'New question', slug: 'new-question', type: 'single_choice', topicId: 'caches',
			options: ['First', 'Second'], correctAnswer: 'First', explanation: null,
		})
		expect(await screen.findByText('Question draft saved.')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Questions (2)' })).toBeInTheDocument()
		expect(screen.getByLabelText(/^Title/)).toHaveValue('')
	})

	it('splits multiple-choice answers by line too', async () => {
		api.createQuestion.mockResolvedValue(q({ id: 'q2' }))
		open()
		await screen.findByRole('option', { name: 'Caches' })
		await fill({ Title: 'Pick two', Slug: 'pick-two', Body: 'Prompt', Options: 'a\nb\nc' })
		await userEvent.selectOptions(screen.getByLabelText('Type'), 'multiple_choice')
		await userEvent.selectOptions(screen.getByLabelText('Topic'), 'caches')
		// The answer field is a single-line input, so a multi-line answer cannot be typed; paste it.
		const answer = screen.getByLabelText(/^Correct answer/)
		await userEvent.click(answer)
		await userEvent.paste('a')
		await userEvent.click(screen.getByRole('button', { name: /Save question draft/ }))
		await waitFor(() => expect(api.createQuestion).toHaveBeenCalled())
		expect(api.createQuestion.mock.calls[0][0].correctAnswer).toEqual(['a'])
	})

	it('keeps the draft and shows the server error when saving fails', async () => {
		api.createQuestion.mockRejectedValue(new Error('Question submission permission required'))
		open()
		await screen.findByRole('option', { name: 'Caches' })
		await fill({ Title: 'New question', Slug: 'new-question', Body: 'Prompt', 'Correct answer': 'true' })
		await userEvent.selectOptions(screen.getByLabelText('Type'), 'true_false')
		await userEvent.selectOptions(screen.getByLabelText('Topic'), 'caches')
		await userEvent.click(screen.getByRole('button', { name: /Save question draft/ }))
		expect(await screen.findByText('Question submission permission required')).toBeInTheDocument()
		expect(screen.getByLabelText(/^Title/)).toHaveValue('New question')
	})

	it('opens and closes the edit dialog', async () => {
		open()
		await userEvent.click(await screen.findByRole('button', { name: 'Open actions for Cache line size' }))
		const dialog = screen.getByRole('dialog', { name: 'Edit question' })
		expect(within(dialog).getByLabelText('Question title')).toHaveValue('Cache line size')
		await userEvent.click(within(dialog).getByRole('button', { name: 'Close edit dialog' }))
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('closes the edit dialog from Cancel and from Save', async () => {
		open()
		await userEvent.click(await screen.findByRole('button', { name: 'Open actions for Cache line size' }))
		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: 'Open actions for Cache line size' }))
		await userEvent.click(screen.getByRole('button', { name: /Save changes/ }))
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})
})

describe('topic drafts', () => {
	it('saves a topic and clears the form', async () => {
		api.createTopic.mockResolvedValue({ id: 'net', name: 'Networking', total: 0, solved: 0 })
		open('topics')
		await screen.findByRole('heading', { name: 'Topic drafts' })
		await userEvent.type(screen.getByLabelText('Name'), 'Networking')
		await userEvent.type(screen.getByLabelText('Slug'), 'networking')
		await userEvent.click(screen.getByRole('button', { name: /Save topic draft/ }))
		expect(api.createTopic).toHaveBeenCalledWith({ name: 'Networking', slug: 'networking', description: null })
		expect(await screen.findByText('Topic draft saved.')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Topics (2)' })).toBeInTheDocument()
		expect(screen.getByLabelText('Name')).toHaveValue('')
	})

	it('sends a description when one is given', async () => {
		api.createTopic.mockResolvedValue({ id: 'net', name: 'N', total: 0, solved: 0 })
		open('topics')
		await screen.findByRole('heading', { name: 'Topic drafts' })
		await userEvent.type(screen.getByLabelText('Name'), 'N')
		await userEvent.type(screen.getByLabelText('Slug'), 'n')
		await userEvent.type(screen.getByLabelText('Description'), 'Packets')
		await userEvent.click(screen.getByRole('button', { name: /Save topic draft/ }))
		expect(api.createTopic).toHaveBeenCalledWith({ name: 'N', slug: 'n', description: 'Packets' })
	})

	it.each([
		['an empty form', '', ''],
		['a bad slug', 'Networking', 'Not A Slug'],
	])('rejects %s client-side', async (_label, name, slug) => {
		open('topics')
		await screen.findByRole('heading', { name: 'Topic drafts' })
		if (name) await userEvent.type(screen.getByLabelText('Name'), name)
		if (slug) await userEvent.type(screen.getByLabelText('Slug'), slug)
		await userEvent.click(screen.getByRole('button', { name: /Save topic draft/ }))
		expect(api.createTopic).not.toHaveBeenCalled()
		expect(document.querySelector('.form-notice')).not.toBeEmptyDOMElement()
	})

	it('shows the server error', async () => {
		api.createTopic.mockRejectedValue(new Error('Content management permission required'))
		open('topics')
		await screen.findByRole('heading', { name: 'Topic drafts' })
		await userEvent.type(screen.getByLabelText('Name'), 'N')
		await userEvent.type(screen.getByLabelText('Slug'), 'n')
		await userEvent.click(screen.getByRole('button', { name: /Save topic draft/ }))
		expect(await screen.findByText('Content management permission required')).toBeInTheDocument()
		expect(screen.getByLabelText('Name')).toHaveValue('N')
	})
})

describe('moderation queues', () => {
	it('shows a clear queue', async () => {
		open('review')
		expect(await screen.findByRole('heading', { name: 'Queue is clear' })).toBeInTheDocument()
	})

	it.each([
		['reviewer', 'submitted', ['Start review']],
		['reviewer', 'in_review', ['Request changes', 'Reject']],
		['reviewer', 'approved', []],
		['admin', 'in_review', ['Approve']],
		['admin', 'approved', ['Publish']],
		['admin', 'submitted', []],
	])('the %s queue offers the right actions for %s', async (queue, status, actions) => {
		api.listModeration.mockResolvedValue({ items: [q({ status })], total: 1 })
		open(queue === 'reviewer' ? 'review' : 'admin')
		const row = (await screen.findByText('Cache line size')).closest('.moderation-row') as HTMLElement
		expect(within(row).queryAllByRole('button').map((button) => button.textContent)).toEqual(actions)
	})

	it('counts waiting questions', async () => {
		api.listModeration.mockResolvedValue({ items: [q(), q({ id: 'q2', title: 'Other' })], total: 2 })
		open('review')
		expect(await screen.findByRole('heading', { name: '2 questions waiting' })).toBeInTheDocument()
	})

	it('applies a transition and updates the row in place', async () => {
		api.listModeration.mockResolvedValue({ items: [q({ status: 'submitted' })], total: 1 })
		api.transitionQuestion.mockResolvedValue(q({ status: 'in_review' }))
		open('review')
		await userEvent.click(await screen.findByRole('button', { name: 'Start review' }))
		expect(api.transitionQuestion).toHaveBeenCalledWith('q1', 'start_review')
		expect(await screen.findByText('Question start review successfully.')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Request changes' })).toBeInTheDocument()
	})

	it.each(['approve', 'publish'])('removes a question from the queue after %s', async (action) => {
		const status = action === 'approve' ? 'in_review' : 'approved'
		api.listModeration.mockResolvedValue({ items: [q({ status })], total: 1 })
		api.transitionQuestion.mockResolvedValue(q({ status: action === 'approve' ? 'approved' : 'published' }))
		open('admin')
		await userEvent.click(await screen.findByRole('button', { name: action[0].toUpperCase() + action.slice(1) }))
		expect(await screen.findByRole('heading', { name: 'Queue is clear' })).toBeInTheDocument()
	})

	it('shows a transition failure', async () => {
		api.listModeration.mockResolvedValue({ items: [q({ status: 'submitted' })], total: 1 })
		api.transitionQuestion.mockRejectedValue(new Error('Invalid workflow transition'))
		open('review')
		await userEvent.click(await screen.findByRole('button', { name: 'Start review' }))
		expect(await screen.findByText('Invalid workflow transition')).toBeInTheDocument()
	})

	it('reloads the queue when switching tabs', async () => {
		open()
		await screen.findByRole('heading', { name: 'Question drafts' })
		await userEvent.click(tab(/Admin queue/))
		await waitFor(() => expect(api.listModeration).toHaveBeenCalledWith('admin'))
		await userEvent.click(tab(/Reviewer queue/))
		await waitFor(() => expect(api.listModeration).toHaveBeenCalledWith('reviewer'))
	})

	it('shows a queue load failure', async () => {
		api.listModeration.mockRejectedValue(new Error('Moderation permission required'))
		open('review')
		expect(await screen.findByText('Moderation permission required')).toBeInTheDocument()
	})
})

describe('roles', () => {
	it('lists assigned tuples', async () => {
		api.listRoleTuples.mockResolvedValue({ items: [{ user: 'user:u1', relation: 'admin', object: 'organization:low-level-lab' }] })
		open('super-admin')
		expect(await screen.findByText('admin')).toBeInTheDocument()
		expect(screen.getByText('user:u1 on organization:low-level-lab')).toBeInTheDocument()
	})

	it('shows an empty list', async () => {
		open('super-admin')
		expect(await screen.findByText('No role assignments found.')).toBeInTheDocument()
	})

	it('offers the four roles with reviewer preselected', async () => {
		open('super-admin')
		const select = await screen.findByLabelText('Role')
		expect(select).toHaveValue('reviewer')
		expect(within(select).getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual(['member', 'reviewer', 'admin', 'super_admin'])
	})

	it('requires a user id before assigning', async () => {
		open('super-admin')
		expect(await screen.findByLabelText('User ID')).toBeRequired()
	})

	it('assigns a role, lists it and resets the form', async () => {
		api.assignRole.mockResolvedValue({ item: { user: 'user:u9', relation: 'admin', object: 'organization:low-level-lab' } })
		open('super-admin')
		await userEvent.type(await screen.findByLabelText('User ID'), 'u9')
		await userEvent.selectOptions(screen.getByLabelText('Role'), 'admin')
		await userEvent.click(screen.getByRole('button', { name: 'Assign role' }))
		expect(api.assignRole).toHaveBeenCalledWith({ userId: 'u9', role: 'admin' })
		expect(await screen.findByText('Role assigned.')).toBeInTheDocument()
		expect(screen.getByText('user:u9 on organization:low-level-lab')).toBeInTheDocument()
		expect(screen.getByLabelText('User ID')).toHaveValue('')
		expect(screen.getByLabelText('Role')).toHaveValue('reviewer')
	})

	it('shows an assignment failure and keeps the draft', async () => {
		api.assignRole.mockRejectedValue(new Error('Super-admin permission required'))
		open('super-admin')
		await userEvent.type(await screen.findByLabelText('User ID'), 'u9')
		await userEvent.click(screen.getByRole('button', { name: 'Assign role' }))
		expect(await screen.findByText('Super-admin permission required')).toBeInTheDocument()
		expect(screen.getByLabelText('User ID')).toHaveValue('u9')
	})
})
