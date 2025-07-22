import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Notes from "./features/Notes";
import ProtectedRoute from "./components/ProtectedRoutes";
import ResumeAnalyzer from "./features/ResumeAnalyzer";
import Chatbot from "./features/Chatbot";
import News from "./features/News";
import AnalysisResults from "./features/AnalysisResults";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/resume" element={<ResumeAnalyzer />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/resume-analysis" element={<AnalysisResults />} />
        <Route path="/news" element={<News />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;