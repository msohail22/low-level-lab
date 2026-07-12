import { Navigate, Route, Routes } from "react-router-dom";

import Bookmarks from "../pages/Bookmarks";
import Dashboard from "../pages/Dashboard";
import DailyChallenge from "../pages/DailyChallenge";
import ForgotPassword from "../pages/ForgotPassword";
import History from "../pages/History";
import Landing from "../pages/Landing";
import Leaderboard from "../pages/Leaderboard";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Question from "../pages/Question";
import Questions from "../pages/Questions";
import Register from "../pages/Register";
import Settings from "../pages/Settings";
import TopicDetails from "../pages/TopicDetails";
import Topics from "../pages/Topics";

export function AppRouter() {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />
			<Route path="/landing" element={<Landing />} />
			<Route path="/home" element={<Navigate to="/" replace />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/daily-challenge" element={<DailyChallenge />} />
			<Route path="/topics" element={<Topics />} />
			<Route path="/topics/:topicId" element={<TopicDetails />} />
			<Route path="/questions" element={<Questions />} />
			<Route path="/questions/:questionId" element={<Question />} />
			<Route path="/question/:questionId" element={<Question />} />
			<Route path="/bookmarks" element={<Bookmarks />} />
			<Route path="/history" element={<History />} />
			<Route path="/leaderboard" element={<Leaderboard />} />
			<Route path="/profile" element={<Profile />} />
			<Route path="/settings" element={<Settings />} />
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}