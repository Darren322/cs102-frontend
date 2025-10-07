// src/components/routing.tsx
import { Navigate, Outlet } from "react-router-dom";
import { getUser, isAuthed } from "./utils/auth";

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  if (roles?.length) {
    const u = getUser();
    if (!u || !u.role || !roles.includes(u.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return <Outlet />; // render nested routes
}

export function PublicOnlyRoute() {
  // If already logged in, prevent visiting /login
  return isAuthed() ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
