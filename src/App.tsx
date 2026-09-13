import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthPage } from '@pages/AuthPage'

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<AuthPage />} />
				<Route path="/reset-password" element={<AuthPage />} />
				<Route path="*" element={<Navigate replace to="/" />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
