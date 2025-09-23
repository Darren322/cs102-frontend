import { Routes, Route } from "react-router-dom";
import Import from "./pages/import";
import LiveCam from "./pages/livecam";

function App() {
  return (
    <div className="p-6 space-y-4">
     

      {/* Navigation */}
    
      {/* Route definitions */}
      <Routes>
        <Route path="/import" element={<Import />} />
        <Route path="/live" element={<LiveCam />} />

      </Routes>
    </div>
  );
}

export default App;
