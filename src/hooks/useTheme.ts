import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lll-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		return stored === 'light' || stored === 'dark' ? stored : null
	} catch {
		return null
	}
}

function systemTheme(): Theme {
	return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme())

	useEffect(() => {
		document.documentElement.dataset.theme = theme
	}, [theme])

	// Follow the system until the reader states a preference of their own.
	useEffect(() => {
		if (readStoredTheme()) return
		const media = window.matchMedia(DARK_QUERY)
		const onChange = (event: MediaQueryListEvent) => {
			// Re-check at event time: a choice made since mount must win.
			if (readStoredTheme()) return
			setTheme(event.matches ? 'dark' : 'light')
		}
		media.addEventListener('change', onChange)
		return () => media.removeEventListener('change', onChange)
	}, [])

	const toggleTheme = useCallback(() => {
		setTheme((current) => {
			const next: Theme = current === 'dark' ? 'light' : 'dark'
			try {
				localStorage.setItem(STORAGE_KEY, next)
			} catch {
				// A blocked store only costs persistence, not the switch itself.
			}
			return next
		})
	}, [])

	return { theme, toggleTheme }
}
