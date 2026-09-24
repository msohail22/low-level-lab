import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { QuestionRow } from '@components/questions/QuestionRow'

const question = {
	id: 'q1',
	title: 'How many cache lines does a 96-byte struct touch?',
	type: 'single_choice',
	difficulty: 'intermediate',
	topicId: 'caches',
	solved: false,
}

function renderRow(overrides: Partial<typeof question> = {}) {
	return render(
		<MemoryRouter>
			<QuestionRow question={{ ...question, ...overrides }} />
		</MemoryRouter>,
	)
}

describe('QuestionRow', () => {
	it('shows the question title', () => {
		renderRow()
		expect(screen.getByText(question.title)).toBeInTheDocument()
	})

	it('links to the question detail route', () => {
		renderRow()
		expect(screen.getByRole('link')).toHaveAttribute('href', '/questions/q1')
	})

	it('prefers a topic name over the raw id when one is supplied', () => {
		renderRow({ topic: 'Caches and locality' } as Partial<typeof question>)
		expect(screen.getByText(/Caches and locality/)).toBeInTheDocument()
	})

	it('falls back to the topic id', () => {
		renderRow()
		expect(screen.getByText(/caches/)).toBeInTheDocument()
	})

	it('renders the question type without underscores', () => {
		renderRow()
		expect(screen.getByText(/single choice/)).toBeInTheDocument()
		expect(screen.queryByText(/single_choice/)).not.toBeInTheDocument()
	})

	it('does not use a middle dot to join metadata', () => {
		const { container } = renderRow()
		expect(container.textContent).not.toContain('·')
	})

	it('shows the difficulty when unsolved', () => {
		renderRow({ difficulty: 'beginner' })
		expect(screen.getByText('beginner')).toBeInTheDocument()
	})

	it('replaces the difficulty with "Held up" once solved', () => {
		renderRow({ solved: true })
		expect(screen.getByText('Held up')).toBeInTheDocument()
		expect(screen.queryByText('intermediate')).not.toBeInTheDocument()
	})

	it('marks a solved question with the teal modifier', () => {
		const { container } = renderRow({ solved: true })
		expect(container.querySelector('.difficulty')?.className).toContain('is-solved')
	})

	it('marks an advanced question with the amber modifier', () => {
		const { container } = renderRow({ difficulty: 'advanced' })
		expect(container.querySelector('.difficulty')?.className).toContain('is-advanced')
	})

	it('leaves a plain intermediate question unmodified', () => {
		const { container } = renderRow()
		const className = container.querySelector('.difficulty')?.className ?? ''
		expect(className).not.toContain('is-solved')
		expect(className).not.toContain('is-advanced')
	})

	it('prefers the solved state over the advanced colour', () => {
		const { container } = renderRow({ solved: true, difficulty: 'advanced' })
		const className = container.querySelector('.difficulty')?.className ?? ''
		expect(className).toContain('is-solved')
		expect(className).not.toContain('is-advanced')
	})
})
