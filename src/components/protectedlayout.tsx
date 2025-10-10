// src/components/ProtectedLayout.tsx
import { Outlet } from "react-router-dom";
import Sidemenu from "./Sidebar";

export default function ProtectedLayout() {
  return (
    <div className="min-h-screen  flex flex-row bg-background text-foreground">
      <Sidemenu />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
