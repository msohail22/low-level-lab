import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "../components/common/AppShell";
import Bookmarks from "../pages/Bookmarks";
import Dashboard from "../pages/Dashboard";
import DailyChallenge from "../pages/DailyChallenge";
import ForgotPassword from "../pages/ForgotPassword";
import History from "../pages/History";
import Landing from "../pages/Landing";
import Leaderboard from "../pages/Leaderboard";
import Login from "../pages/Login";
import Method from "../pages/Method";
import Formats from "../pages/Formats";
import Error500 from "../pages/Error500";
import NotFound from "../pages/NotFound";
import Onboarding from "../pages/Onboarding";
import Profile from "../pages/Profile";
import Complete from "../pages/Complete";
import Question from "../pages/Question";
import Questions from "../pages/Questions";
import Search from "../pages/Search";
import Register from "../pages/Register";
import Settings from "../pages/Settings";
import States from "../pages/States";
import TopicDetails from "../pages/TopicDetails";
import Topics from "../pages/Topics";
import AdminShell from "../pages/admin/AdminShell";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminTopics from "../pages/admin/Topics";
import AdminQuestion from "../pages/admin/Question";
import AdminReview from "../pages/admin/Review";

export function AppRouter() {
	return (
		<AppShell>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/landing" element={<Landing />} />
				<Route path="/home" element={<Navigate to="/" replace />} />
				<Route path="/login" element={<Login />} />
				<Route path="/signin" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/signup" element={<Register />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/daily-challenge" element={<DailyChallenge />} />
				<Route path="/topics" element={<Topics />} />
				<Route path="/topics/:topicId" element={<TopicDetails />} />
				<Route path="/track" element={<TopicDetails />} />
				<Route path="/questions" element={<Questions />} />
				<Route path="/questions/:questionId" element={<Question />} />
				<Route path="/question/:questionId" element={<Question />} />
				<Route path="/problem" element={<Question />} />
				<Route path="/bookmarks" element={<Bookmarks />} />
				<Route path="/history" element={<History />} />
				<Route path="/leaderboard" element={<Leaderboard />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/account" element={<Profile />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/method" element={<Method />} />
				<Route path="/formats" element={<Formats />} />
				<Route path="/states" element={<States />} />
				<Route path="/search" element={<Search />} />
				<Route path="/onboarding" element={<Onboarding />} />
				<Route path="/complete" element={<Complete />} />
				<Route path="/404" element={<NotFound />} />
				<Route path="/500" element={<Error500 />} />
				<Route
					path="/admin"
					element={
						<AdminShell>
							<AdminDashboard />
						</AdminShell>
					}
				/>
				<Route
					path="/admin/topics"
					element={
						<AdminShell>
							<AdminTopics />
						</AdminShell>
					}
				/>
				<Route
					path="/admin/question"
					element={
						<AdminShell>
							<AdminQuestion />
						</AdminShell>
					}
				/>
				<Route
					path="/admin/review"
					element={
						<AdminShell>
							<AdminReview />
						</AdminShell>
					}
				/>
				<Route path="*" element={<NotFound />} />
			</Routes>
		</AppShell>
	);
}