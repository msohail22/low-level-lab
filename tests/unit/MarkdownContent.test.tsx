import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MarkdownContent } from '@components/shared/MarkdownContent'

describe('MarkdownContent', () => {
	it('renders a paragraph', () => {
		render(<MarkdownContent content="A cache line is 64 bytes." />)
		expect(screen.getByText('A cache line is 64 bytes.')).toBeInTheDocument()
	})

	it.each([
		['# ', 'h1'],
		['## ', 'h2'],
		['### ', 'h3'],
	])('renders %s as %s', (prefix, tag) => {
		const { container } = render(<MarkdownContent content={`${prefix}Heading`} />)
		expect(container.querySelector(tag)?.textContent).toBe('Heading')
	})

	it('renders a blockquote', () => {
		const { container } = render(<MarkdownContent content="> Measure before you guess." />)
		expect(container.querySelector('blockquote')?.textContent).toBe('Measure before you guess.')
	})

	it('renders a list item', () => {
		const { container } = render(<MarkdownContent content="- L1 is four cycles" />)
		expect(container.querySelector('li')?.textContent).toBe('L1 is four cycles')
	})

	it('renders inline code', () => {
		const { container } = render(<MarkdownContent content="Call `memcpy` here." />)
		expect(container.querySelector('code')?.textContent).toBe('memcpy')
	})

	it('renders inline math with its own class', () => {
		const { container } = render(<MarkdownContent content="It costs $O(n)$ to scan." />)
		expect(container.querySelector('.math-inline')?.textContent).toBe('O(n)')
	})

	it('renders display math', () => {
		const { container } = render(<MarkdownContent content="$$a^2 + b^2$$" />)
		expect(container.querySelector('.math-inline')?.textContent).toBe('a^2 + b^2')
	})

	it('turns a blank line into a break', () => {
		const { container } = render(<MarkdownContent content={'one\n\ntwo'} />)
		expect(container.querySelectorAll('br')).toHaveLength(1)
	})

	it('handles several lines of mixed content', () => {
		const { container } = render(<MarkdownContent content={'# Title\nBody text\n- item'} />)
		expect(container.querySelector('h1')).toBeInTheDocument()
		expect(container.querySelector('li')).toBeInTheDocument()
	})

	it('renders empty content without throwing', () => {
		const { container } = render(<MarkdownContent content="" />)
		expect(container.querySelector('.markdown-content')).toBeInTheDocument()
	})

	it('leaves an unmatched backtick as literal text', () => {
		render(<MarkdownContent content="a ` b" />)
		expect(screen.getByText(/a ` b/)).toBeInTheDocument()
	})
})
