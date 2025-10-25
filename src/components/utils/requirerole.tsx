// src/components/RequireRole.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRole } from "./auth"; // adjust path if not using alias

export default function RequireRole({ allow }: { allow: string[] }) {
  const role = getRole();
  const loc = useLocation();

  if (!role) return <Navigate to="/login" replace state={{ from: loc }} />;

  // If you want case-insensitive matching, uncomment next line:
  // const ok = allow.map(a => a.toUpperCase()).includes(role.toUpperCase());
  const ok = allow.includes(role);

  return ok ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
