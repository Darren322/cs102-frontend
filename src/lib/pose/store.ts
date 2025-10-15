import type { PoseCenters } from "./calibration";
const KEY = "poseCenters.v1";

export const saveCenters = (c: PoseCenters) =>
  localStorage.setItem(KEY, JSON.stringify(c));

export const loadCenters = (): PoseCenters | null => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as PoseCenters; } catch { return null; }
};
