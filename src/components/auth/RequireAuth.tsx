import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@hooks/useAuth'

type RequireAuthProps = {
	children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
	const { data: session, isPending } = useAuth()
	const location = useLocation()

	if (isPending) {
		return <main className="auth-shell">Loading session...</main>
	}

	if (!session?.user) {
		return (
			<Navigate
				replace
				to="/auth"
				state={{
					from: `${location.pathname}${location.search}${location.hash}`,
				}}
			/>
		)
	}

	return children
}
