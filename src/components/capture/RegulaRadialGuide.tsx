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
    default: return -90; 
  }
}

type Props = {
  circleSize: number;       // exact video circle DIAMETER (must match CameraCircle)
  hintDirection: Direction;
  done?: boolean;
  hintFraction?: number;
  spokes?: number;
  gap?: number;
  tickLength?: number;
  baseColor?: string;
  glowColor?: string;
};

export default function RegulaSpokeCrown({
  circleSize,
  hintDirection,
  done = false,
  hintFraction = 0.10,
  spokes = 100,
  gap = 12,
  tickLength = 20,
  baseColor = "rgba(110,108,109,0.80)",
  glowColor = "rgba(16,185,129,0.95)",
}: Props) {
  // Geometry
  const OUTER = circleSize + 2 * (gap + tickLength); // full svg box (DIAMETER)
  const rVideo = circleSize / 2;
  const rInner = rVideo + gap;            // ring radius
  const rOuter = rInner + tickLength;     // tick end radius

  // Make the parent decide pixel size; we render in a centered coordinate system.
  // Center at (0,0) and draw symmetrically so it aligns with parent translate(-50%,-50%).
  const viewBox = `${-OUTER / 2} ${-OUTER / 2} ${OUTER} ${OUTER}`;

  const angles = React.useMemo(
    () => Array.from({ length: spokes }, (_, i) => -90 + (i * 360) / spokes),
    [spokes]
  );
  const targetAngle = dirToAngle(hintDirection);
  const centerIdx = nearestIdx(angles, targetAngle);

  const hintCount = hintDirection === "STRAIGHT"
    ? spokes
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
      width="100%"
      height="100%"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {/* Base ring */}
      <circle
        cx={0} cy={0} r={rInner}
        fill="none"
        stroke={baseColor}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />

      {/* Ticks */}
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
            vectorEffect="non-scaling-stroke"
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
