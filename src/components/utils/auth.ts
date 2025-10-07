// src/auth.ts
import {jwtDecode} from "jwt-decode";

export type JwtPayload = { sub: string; role?: string; exp?: number };
export const TOKEN_KEY = "token";

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

export function isAuthed(): boolean {
  const t = getToken();
  if (!t) return false;
  try {
    const p = jwtDecode<JwtPayload>(t);
    return !p.exp || p.exp * 1000 > Date.now();
  } catch { return false; }
}

export function getUser(): JwtPayload | null {
  const t = getToken();
  if (!t) return null;
  try { return jwtDecode<JwtPayload>(t); } catch { return null; }
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
