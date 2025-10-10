// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Import from "./pages/import";
import LoginPage from "./pages/login";
import LiveCam from "./pages/DuringSession";
import SessionsPage from './pages/Session';
import DashboardPage from "./pages/Dashboard";
import RostersPage from "./pages/Roster";
import Students from "./components/students";
import { ProtectedRoute, PublicOnlyRoute } from "./components/routing";
import AttendanceDetails from "./pages/AttendanceDetails";
import RegisterPage from "./pages/register";
import ProtectedLayout from "./components/protectedlayout";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes (with layout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/rosters" element={<RostersPage />} />
          <Route path="/import" element={<Import />} />
          <Route path="/session_start" element={<LiveCam />} />
          <Route path="/students" element={<Students />} />
          <Route path="/attendancedetails/:id" element={<AttendanceDetails />} />
          <Route path="/sessions" element={<SessionsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
