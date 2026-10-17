import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Worker tests run in the node environment (`// @vitest-environment node`), where there is no DOM.
const hasDom = typeof document !== 'undefined'

afterEach(() => {
	if (!hasDom) return
	cleanup()
	localStorage.clear()
	document.documentElement.removeAttribute('data-theme')
})

// jsdom has no matchMedia; tests that care about the colour scheme override this.
beforeEach(() => {
	if (hasDom && !window.matchMedia) {
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}))
	}
})
