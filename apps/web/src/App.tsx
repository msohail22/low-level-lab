import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import MyQuestions from "@/pages/contribute/MyQuestions";
import NewQuestion from "@/pages/contribute/NewQuestion";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import ReviewQueue from "@/pages/review/ReviewQueue";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contribute/questions" element={<MyQuestions />} />
        <Route path="/contribute/questions/new" element={<NewQuestion />} />
        <Route path="/review/questions" element={<ReviewQueue />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
