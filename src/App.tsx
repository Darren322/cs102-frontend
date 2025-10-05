import { Routes, Route, Navigate } from "react-router-dom";
import Import from "./pages/import";
import LiveCam from "./pages/livecam";
import LoginPage from "./pages/login";

function App() {
  return (
    <div className="p-6 space-y-4">
     

      {/* Navigation */}
    
      {/* Route definitions */}
      <Routes>
        <Route path="/import" element={<Import />} />
        <Route path="/live" element={<LiveCam />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
