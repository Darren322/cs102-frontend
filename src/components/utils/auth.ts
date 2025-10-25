// src/auth.ts
import { jwtDecode } from "jwt-decode";

// ✅ include optional claims your backend emits
export type JwtPayload = {
  sub: string;          // usually the email/username
  email?: string;       // optional email claim
  username?: string;    // optional username claim
  role?: string;        // or roles?: string[]
  exp?: number;
};

export const TOKEN_KEY = "token";

export const getToken = () =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

export function isAuthed(): boolean {
  const t = getToken();
  if (!t) return false;
  try {
    const p = jwtDecode<JwtPayload>(t);
    return !p.exp || p.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUser(): JwtPayload | null {
  const t = getToken();
  if (!t) return null;
  try {
    return jwtDecode<JwtPayload>(t);
  } catch {
    return null;
  }
}

// (nice helper if you want one place to decide username/email)
export function resolveJwtUsername(p: JwtPayload | null): string {
  if (!p) return "user@example.com";
  return (p.sub || p.email || p.username || "user@example.com").toString();
}

export function getRole(): string | null {
  const p = getUser();
  const fromJwt =
    (p?.role ??
      // if backend sometimes sends an array
      (Array.isArray((p as any)?.roles) ? (p as any).roles[0] : undefined)) as string | undefined;

  return fromJwt ?? sessionStorage.getItem("role") ?? localStorage.getItem("role");
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
