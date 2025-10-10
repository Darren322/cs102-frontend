// src/components/ProtectedLayout.tsx
import { Outlet } from "react-router-dom";
import Sidemenu from "./Sidebar";

export default function ProtectedLayout() {
  return (
    <div className="mx-5 space-y-4 flex flex-row">
      <Sidemenu />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
