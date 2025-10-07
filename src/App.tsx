// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Import from "./pages/import";
import LoginPage from "./pages/login";
import LiveCam from "./pages/DuringSession";
import SessionsPage from './pages/Session';
import Sidemenu from './components/Sidebar'
import DashboardPage from "./pages/Dashboard";
import RostersPage from "./pages/Roster";
import Students from "./components/students";
import { ProtectedRoute, PublicOnlyRoute } from "./components/routing";

function App() {
  
  return (
    <div className="mx-5 space-y-4 flex flex-row">
      <Sidemenu/>
      <Routes>
        {/* Public-only (e.g., /login) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/rosters" element={<RostersPage />} />
          <Route path="/import" element={<Import />} />
          <Route path="/session_start" element={<LiveCam />} />
          <Route path="/students" element={<Students />} />
          <Route path="/sessions" element={<SessionsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
