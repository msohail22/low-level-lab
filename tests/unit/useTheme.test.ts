import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from '@hooks/useTheme'

const STORAGE_KEY = 'lll-theme'

type Listener = (event: MediaQueryListEvent) => void

/** Stand in for the OS colour-scheme setting, with a handle to flip it. */
function mockColorScheme(prefersDark: boolean) {
	const listeners: Listener[] = []
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: prefersDark,
		media: query,
		onchange: null,
		addEventListener: (_: string, listener: Listener) => listeners.push(listener),
		removeEventListener: (_: string, listener: Listener) => {
			const index = listeners.indexOf(listener)
			if (index >= 0) listeners.splice(index, 1)
		},
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}))
	return {
		change(matches: boolean) {
			act(() => listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent)))
		},
		listenerCount: () => listeners.length,
	}
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('initial theme', () => {
	it('follows a dark system preference when nothing is stored', () => {
		mockColorScheme(true)
		const { result } = renderHook(() => useTheme())
		expect(result.current.theme).toBe('dark')
	})

	it('follows a light system preference when nothing is stored', () => {
		mockColorScheme(false)
		const { result } = renderHook(() => useTheme())
		expect(result.current.theme).toBe('light')
	})

	it('prefers a stored choice over the system preference', () => {
		mockColorScheme(true)
		localStorage.setItem(STORAGE_KEY, 'light')
		const { result } = renderHook(() => useTheme())
		expect(result.current.theme).toBe('light')
	})

	it('ignores a stored value that is not a theme', () => {
		mockColorScheme(true)
		localStorage.setItem(STORAGE_KEY, 'chartreuse')
		const { result } = renderHook(() => useTheme())
		expect(result.current.theme).toBe('dark')
	})
})

describe('applying the theme', () => {
	it('writes data-theme onto the document element', () => {
		mockColorScheme(false)
		renderHook(() => useTheme())
		expect(document.documentElement.dataset.theme).toBe('light')
	})

	it('updates the attribute when the theme changes', () => {
		mockColorScheme(false)
		const { result } = renderHook(() => useTheme())
		act(() => result.current.toggleTheme())
		expect(document.documentElement.dataset.theme).toBe('dark')
	})
})

describe('toggling', () => {
	it('moves from light to dark', () => {
		mockColorScheme(false)
		const { result } = renderHook(() => useTheme())
		act(() => result.current.toggleTheme())
		expect(result.current.theme).toBe('dark')
	})

	it('moves from dark back to light', () => {
		mockColorScheme(true)
		const { result } = renderHook(() => useTheme())
		act(() => result.current.toggleTheme())
		expect(result.current.theme).toBe('light')
	})

	it('persists the choice so a reload keeps it', () => {
		mockColorScheme(false)
		const { result } = renderHook(() => useTheme())
		act(() => result.current.toggleTheme())
		expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
	})

	it('survives a remount', () => {
		mockColorScheme(false)
		const first = renderHook(() => useTheme())
		act(() => first.result.current.toggleTheme())
		first.unmount()

		const second = renderHook(() => useTheme())
		expect(second.result.current.theme).toBe('dark')
	})
})

describe('following the system', () => {
	it('reacts to the OS switching to dark while no choice is stored', () => {
		const media = mockColorScheme(false)
		const { result } = renderHook(() => useTheme())
		expect(result.current.theme).toBe('light')
		media.change(true)
		expect(result.current.theme).toBe('dark')
	})

	it('stops following the system once the reader has chosen', () => {
		const media = mockColorScheme(false)
		const { result } = renderHook(() => useTheme())
		act(() => result.current.toggleTheme())
		expect(result.current.theme).toBe('dark')

		// The OS going light must not override an explicit choice.
		media.change(false)
		expect(result.current.theme).toBe('dark')
	})

	it('does not subscribe at all when a choice is already stored', () => {
		localStorage.setItem(STORAGE_KEY, 'dark')
		const media = mockColorScheme(false)
		renderHook(() => useTheme())
		expect(media.listenerCount()).toBe(0)
	})

	it('removes its listener on unmount', () => {
		const media = mockColorScheme(false)
		const { unmount } = renderHook(() => useTheme())
		expect(media.listenerCount()).toBe(1)
		unmount()
		expect(media.listenerCount()).toBe(0)
	})
})

describe('when storage is unavailable', () => {
	it('still resolves a theme if reading throws', () => {
		mockColorScheme(true)
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('SecurityError')
		})
		const { result } = renderHook(() => useTheme())
		expect(result.current.theme).toBe('dark')
	})

	it('still toggles if writing throws', () => {
		mockColorScheme(false)
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('QuotaExceededError')
		})
		const { result } = renderHook(() => useTheme())
		act(() => result.current.toggleTheme())
		expect(result.current.theme).toBe('dark')
	})
})
