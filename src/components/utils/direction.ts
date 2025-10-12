// src/components/utils/direction.ts
import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

/** Clamp to avoid NaN from numeric jitter */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const FLIP_YAW = true;
/** Angle between two vectors (mid->p1) and (mid->p2) in DEGREES. ~90° means "neutral". */
function angleBetween(
  mid: NormalizedLandmark,
  p1: NormalizedLandmark,
  p2: NormalizedLandmark
): number {
  const v1x = p1.x - mid.x, v1y = p1.y - mid.y;
  const v2x = p2.x - mid.x, v2y = p2.y - mid.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
  if (!m1 || !m2) return 90;
  const cos = clamp(dot / (m1 * m2), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

export type Angles = {
  /** raw angles: ~90° is neutral */
  yaw: number;     // smaller → right, larger → left
  pitch: number;   // smaller → up, larger → down
  /** signed deltas from neutral 90° */
  yawDelta: number;   // + = left,  - = right  (after mirror option)
  pitchDelta: number; // + = up,    - = down   (after invert option)
};

type AngleOpts = {
  /** swap L/R like a selfie preview */
  mirrorPreview?: boolean;
  /** flip vertical if your cam feels inverted for pitch */
  invertPitch?: boolean;
};

/**
 * Compute yaw/pitch from nose triangle and return signed deltas from 90°.
 * This is robust, dependency-free, and matches the blog/triangle method.
 */
export function anglesFromNose(
  res: FaceLandmarkerResult | null | undefined,
  opts: AngleOpts = {}
): Angles {
  const { mirrorPreview = true, invertPitch = false } = opts;
  const lm = res?.faceLandmarks?.[0];
  if (!lm || !lm[1] || !lm[279] || !lm[49]) {
    return { yaw: 90, pitch: 90, yawDelta: 0, pitchDelta: 0 };
    }
  const noseTip = lm[1];
  const leftNose = lm[279];
  const rightNose = lm[49];

  const mid: NormalizedLandmark = {
    x: (leftNose.x + rightNose.x) / 2,
    y: (leftNose.y + rightNose.y) / 2,
    z: (leftNose.z + rightNose.z) / 2,
    visibility: 0,
  };

  // image-space "up" is negative y
  const upRef: NormalizedLandmark = { x: mid.x, y: mid.y - 0.1, z: mid.z, visibility: 0 };

  // raw angles (≈90° neutral)
  const pitch = angleBetween(mid, noseTip, upRef);      // smaller → up, larger → down
  const yawRaw = angleBetween(mid, rightNose, noseTip); // smaller → right, larger → left

  // deltas from neutral
  // yawDelta: +left, -right
  let yawDelta = yawRaw - 90;
  if (mirrorPreview) yawDelta = -yawDelta; // selfie swap L/R

  // pitchDelta: +up, -down
  let pitchDelta = 90 - pitch; // smaller pitch => positive (up)
  if (invertPitch) pitchDelta = -pitchDelta;

  return { yaw: yawRaw, pitch, yawDelta, pitchDelta };
}

/**
 * Check if current angles match a target (relative to baseline) within tolerances.
 * target.yaw/pitch are deltas in degrees (e.g., right = +35 yaw, up = -25 pitch → {yaw:35,pitch:-25})
 */
export function isPoseMatch(
  current: { yawDelta: number; pitchDelta: number },
  target: { yaw: number; pitch: number },
  tol: { yaw: number; pitch: number }
) {
  const okYaw = Math.abs(current.yawDelta - target.yaw) <= tol.yaw;
  const okPitch = Math.abs(current.pitchDelta - target.pitch) <= tol.pitch;
  return okYaw && okPitch;
}
