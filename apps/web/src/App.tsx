import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute, ReviewerRoute } from "@/components/RoleRoutes";
import AdminHome from "@/pages/admin/AdminHome";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import MyQuestions from "@/pages/contribute/MyQuestions";
import NewQuestion from "@/pages/contribute/NewQuestion";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Achievements from "@/pages/learn/Achievements";
import AuthorProfile from "@/pages/learn/AuthorProfile";
import DailyChallenge from "@/pages/learn/DailyChallenge";
import FollowingFeed from "@/pages/learn/FollowingFeed";
import Glossary from "@/pages/learn/Glossary";
import Leaderboard from "@/pages/learn/Leaderboard";
import PathDetailPage from "@/pages/learn/PathDetail";
import Paths from "@/pages/learn/Paths";
import PracticeQuestion from "@/pages/learn/PracticeQuestion";
import QuestionSets from "@/pages/learn/QuestionSets";
import WeakDrill from "@/pages/learn/WeakDrill";
import EditQuestion from "@/pages/contribute/EditQuestion";
import { Bookmarks, DueReviews, Mistakes } from "@/pages/learn/Queues";
import TopicQuestions from "@/pages/learn/TopicQuestions";
import Topics from "@/pages/learn/Topics";
import ReviewQueue from "@/pages/review/ReviewQueue";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/topics" element={<Topics />} />
      <Route path="/topics/:topicId" element={<TopicQuestions />} />
      <Route path="/paths" element={<Paths />} />
      <Route path="/paths/:pathId" element={<PathDetailPage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/challenge" element={<DailyChallenge />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/glossary" element={<Glossary />} />
      <Route path="/glossary/:slug" element={<Glossary />} />
      <Route path="/sets" element={<QuestionSets />} />
      <Route path="/sets/:setId" element={<QuestionSets />} />
      <Route path="/authors/:authorId" element={<AuthorProfile />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice/:questionId" element={<PracticeQuestion />} />
        <Route path="/due" element={<DueReviews />} />
        <Route path="/mistakes" element={<Mistakes />} />
        <Route path="/drill" element={<WeakDrill />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/feed" element={<FollowingFeed />} />
        <Route path="/contribute/questions" element={<MyQuestions />} />
        <Route path="/contribute/questions/new" element={<NewQuestion />} />
        <Route path="/contribute/questions/:questionId/edit" element={<EditQuestion />} />
        <Route element={<ReviewerRoute />}>
          <Route path="/review/questions" element={<ReviewQueue />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
