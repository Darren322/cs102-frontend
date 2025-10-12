import * as React from "react";

export type Direction =
  | "UP" | "UP-RIGHT" | "RIGHT" | "DOWN-RIGHT"
  | "DOWN" | "DOWN-LEFT" | "LEFT" | "UP-LEFT"
  | "STRAIGHT" | "NO_FACE";

function dirToAngle(d: Direction) {
  switch (d) {
    case "UP": return -90;
    case "UP-RIGHT": return -45;
    case "RIGHT": return 0;
    case "DOWN-RIGHT": return 45;
    case "DOWN": return 90;
    case "DOWN-LEFT": return 135;
    case "LEFT": return 180;
    case "UP-LEFT": return -135;
    default: return -90; // STRAIGHT/NO_FACE ~ up
  }
}

type Props = {
  /** Size of your circular video (same as <CameraCircle size>) */
  circleSize: number;

  /** The step you want to hint (target) */
  hintDirection: Direction;

  /** When true, force the ring back to gray (e.g., when flow is done) */
  done?: boolean;

  /** How wide the hint should be: fraction of ring (e.g., 0.1 = 1/10) */
  hintFraction?: number;

  /** Style knobs */
  spokes?: number;        // default 100
  gap?: number;           // distance from video edge to tick start (px)
  tickLength?: number;    // length of each tick (px)
  baseColor?: string;     // gray default
  glowColor?: string;     // green hint
};

export default function RegulaSpokeCrown({
  circleSize,
  hintDirection,
  done = false,
  hintFraction = 0.10,
  spokes = 100,
  gap = 12,
  tickLength = 20,
  baseColor = "rgba(110,108,109,0.80)",     // gray
  glowColor = "rgba(16,185,129,0.95)",      // emerald
}: Props) {
  const rVideo = circleSize / 2;
  const rInner = rVideo + gap;
  const rOuter = rInner + tickLength;
  const vb = rOuter + 10;

  const angles = React.useMemo(
    () => Array.from({ length: spokes }, (_, i) => -90 + (i * 360) / spokes),
    [spokes]
  );
  const targetAngle = dirToAngle(hintDirection);
  const centerIdx = nearestIdx(angles, targetAngle);

  const hintCount = hintDirection === "STRAIGHT"
    ? spokes                          // full ring green when straight
    : Math.max(1, Math.round(spokes * hintFraction));

  const glow = new Set<number>();
  if (!done && hintCount > 0) {
    const half = Math.floor(hintCount / 2);
    for (let k = -half; k < hintCount - half; k++) {
      glow.add(mod(centerIdx + k, spokes));
    }
  }

  return (
    <svg
      width={vb * 2}
      height={vb * 2}
      viewBox={[-vb, -vb, vb * 2, vb * 2].join(" ")}
      style={{ display: "block" }}
    >
      {angles.map((ang, i) => {
        const { x1, y1, x2, y2 } = lineFor(ang, rInner, rOuter);
        const active = glow.has(i);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={active ? glowColor : baseColor}
            strokeWidth={active ? 3 : 2}
            strokeLinecap="round"
            style={{
              filter: active ? "drop-shadow(0 0 8px rgba(16,185,129,0.7))" : undefined,
              transition: "stroke 120ms, stroke-width 120ms, filter 120ms",
            }}
          />
        );
      })}
    </svg>
  );
}

// helpers
function lineFor(deg: number, r1: number, r2: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x1: r1 * Math.cos(rad),
    y1: r1 * Math.sin(rad),
    x2: r2 * Math.cos(rad),
    y2: r2 * Math.sin(rad),
  };
}
function mod(n: number, m: number) { return ((n % m) + m) % m; }
function nearestIdx(angles: number[], target: number) {
  let best = 0, dmin = Infinity;
  for (let i = 0; i < angles.length; i++) {
    const d = angDiff(angles[i], target);
    if (d < dmin) { dmin = d; best = i; }
  }
  return best;
}
function angDiff(a: number, b: number) {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
