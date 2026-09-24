import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BrandMark } from '@components/layout/BrandMark'

/**
 * The mark's geometry is a design decision, not an implementation detail:
 * the constant +7 width increment is what makes the staircase read as a
 * rhythm, and the 6-unit bar height is what keeps it legible at 16px.
 */
describe('BrandMark geometry', () => {
	function bars(container: HTMLElement) {
		return [...container.querySelectorAll('rect')].slice(1)
	}

	it('renders a tile plus three bars', () => {
		const { container } = render(<BrandMark />)
		expect(container.querySelectorAll('rect')).toHaveLength(4)
	})

	it('widens the bars by a constant seven units', () => {
		const { container } = render(<BrandMark />)
		const widths = bars(container).map((bar) => Number(bar.getAttribute('width')))
		expect(widths).toEqual([10, 17, 24])
		expect(widths[1] - widths[0]).toBe(7)
		expect(widths[2] - widths[1]).toBe(7)
	})

	it('keeps every bar six units tall', () => {
		const { container } = render(<BrandMark />)
		expect(bars(container).map((bar) => bar.getAttribute('height'))).toEqual(['6', '6', '6'])
	})

	it('leaves four units between bars', () => {
		const { container } = render(<BrandMark />)
		const ys = bars(container).map((bar) => Number(bar.getAttribute('y')))
		expect(ys[1] - ys[0] - 6).toBe(4)
		expect(ys[2] - ys[1] - 6).toBe(4)
	})

	it('shares one left edge across all three bars', () => {
		const { container } = render(<BrandMark />)
		expect(bars(container).map((bar) => bar.getAttribute('x'))).toEqual(['12', '12', '12'])
	})

	it('centres the bar block vertically in the tile', () => {
		const { container } = render(<BrandMark />)
		const ys = bars(container).map((bar) => Number(bar.getAttribute('y')))
		const top = ys[0]
		const bottom = ys[2] + 6
		expect((top + bottom) / 2).toBe(24)
	})

	it('uses the 48 unit grid', () => {
		const { container } = render(<BrandMark />)
		expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 48 48')
	})

	it('draws the tile with the brand amber', () => {
		const { container } = render(<BrandMark />)
		expect(container.querySelector('rect')).toHaveAttribute('fill', 'var(--amber-bright)')
	})

	it('defaults to 36px and honours an explicit size', () => {
		const { container: fallback } = render(<BrandMark />)
		expect(fallback.querySelector('svg')).toHaveAttribute('width', '36')

		const { container: sized } = render(<BrandMark size={16} />)
		expect(sized.querySelector('svg')).toHaveAttribute('width', '16')
	})

	it('is hidden from assistive technology, since the name sits beside it', () => {
		const { container } = render(<BrandMark />)
		expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
	})
})
