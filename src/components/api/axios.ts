// src/api/axios.ts
import axios from "axios";
import { getToken } from "../utils/auth";

export const api = axios.create({
  baseURL: "http://localhost:8081", // adjust
  withCredentials: true,            // fine even if using body tokens
});

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
