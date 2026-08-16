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
import Leaderboard from "@/pages/learn/Leaderboard";
import PracticeQuestion from "@/pages/learn/PracticeQuestion";
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
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice/:questionId" element={<PracticeQuestion />} />
        <Route path="/contribute/questions" element={<MyQuestions />} />
        <Route path="/contribute/questions/new" element={<NewQuestion />} />
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
