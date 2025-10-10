// src/components/ProtectedLayout.tsx
import { Outlet } from "react-router-dom";
import Sidemenu from "./Sidebar";

export default function ProtectedLayout() {
  return (
    <div className="min-h-screen space-y-4 flex flex-row bg-background text-foreground">
      <Sidemenu />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
