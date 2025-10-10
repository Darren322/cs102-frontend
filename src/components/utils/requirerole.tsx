// src/components/RequireRole.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getRole } from './auth';

export default function RequireRole({ allow }: { allow: Array<'STUDENT'|'STAFF'|'ADMIN'> }) {
  const role = getRole();
  const loc = useLocation();
  if (!role) return <Navigate to="/login" replace state={{ from: loc }} />;
  return allow.includes(role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
