export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function angularDiffAbs(a: number, b: number) {
  // a,b in degrees
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function smoothStep01(x: number) {
  // smootherstep clamped
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}
