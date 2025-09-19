import { Routes, Route, Link } from "react-router-dom";
import Import from "./pages/import";
import LiveCam from "./pages/livecam";

function App() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Face Scanner</h1>

      {/* Navigation */}
      <nav className="flex gap-4">
        <Link to="/import" className="text-blue-600 hover:underline">Import</Link>
        <Link to="/live" className="text-blue-600 hover:underline">Live Camera</Link>
      </nav>

      {/* Route definitions */}
      <Routes>
        <Route path="/import" element={<Import />} />
        <Route path="/live" element={<LiveCam />} />

     
      </Routes>
    </div>
  );
}

export default App;
