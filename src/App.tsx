import { Routes, Route, Navigate } from "react-router-dom";
import Import from "./pages/import";
import LoginPage from "./pages/login";
import LiveCam from "./pages/DuringSession";
import SessionsPage from './pages/Session';
import Sidemenu from './components/Sidebar'
import DashboardPage from "./pages/Dashboard";
import RostersPage from "./pages/Roster";

function App() {
  return (
    <div className="p-6 space-y-4 flex flex-row ">
     

      {/* Navigation */}
    
      {/* Route definitions */}
      <Sidemenu/>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rosters" element={<RostersPage />} />
        <Route path="/import" element={<Import />} />
        <Route path="/session_start" element={<LiveCam />} />
          <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/sessions" element={<SessionsPage />} />
      </Routes>
    </div>
  );
}

export default App;
