import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@components/layout/AppLayout'
import { AuthPage } from '@pages/AuthPage'
import { DashboardPage } from '@pages/DashboardPage'
import { ProgressPage } from '@pages/ProgressPage'
import { QuestionDetailPage } from '@pages/QuestionDetailPage'
import { QuestionsPage } from '@pages/QuestionsPage'
import { TopicsPage } from '@pages/TopicsPage'
import { TopicDetailPage } from '@pages/TopicDetailPage'
import { ContentManagementPage } from '@pages/ContentManagementPage'
import { AnalyticsPage } from '@pages/AnalyticsPage'

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<AppLayout />}>
					<Route index element={<DashboardPage />} />
					<Route path="questions" element={<QuestionsPage />} />
					<Route path="questions/:questionId" element={<QuestionDetailPage />} />
					<Route path="topics" element={<TopicsPage />} />
					<Route path="topics/:topicId" element={<TopicDetailPage />} />
					<Route path="progress" element={<ProgressPage />} />
					<Route path="manage" element={<ContentManagementPage />} />
					<Route path="analytics" element={<AnalyticsPage />} />
				</Route>
				<Route path="auth" element={<AuthPage />} />
				<Route path="reset-password" element={<AuthPage />} />
				<Route path="*" element={<Navigate replace to="/" />} />
			</Routes>
		</BrowserRouter>
	)
}
