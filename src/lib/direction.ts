import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";



export type Direction =
    | "UP"
    | "DOWN"
    | "LEFT"
    | "RIGHT"
    | "UP-LEFT"
    | "UP-RIGHT"
    | "DOWN-LEFT"
    | "DOWN-RIGHT"
    | "STRAIGHT"
    | "NO_FACE";
const PITCH_UP_THRESHOLD = 100;
const PITCH_DOWN_THRESHOLD = 140;
const YAW_RIGHT_THRESHOLD = 58;
const YAW_LEFT_THRESHOLD = 95;

const FLIP_YAW = false;


export let YAW_CENTER = 90;
export let PITCH_CENTER = 90;

// Quick setter so you can calibrate at runtime
export function setStraightCenter(yaw: number, pitch: number) {
  YAW_CENTER = yaw;
  PITCH_CENTER = pitch;
}

// Make the deltas reasonable again (50 is basically "always straight")
export const STRAIGHT_DELTA_YAW = 28;   // 10–18 is a good range
export const STRAIGHT_DELTA_PITCH = 80;

// Center-aware straight check
export function isStraight(yaw: number, pitch: number) {
  return Math.abs(yaw - YAW_CENTER) <= STRAIGHT_DELTA_YAW &&
         Math.abs(pitch - PITCH_CENTER) <= STRAIGHT_DELTA_PITCH;
}

export function getAngles(res?: FaceLandmarkerResult) {
    const lm = res?.faceLandmarks?.[0];
    if (!lm || !lm[1] || !lm[279] || !lm[49]) return { yaw: 90, pitch: 90, ok: false };
    const noseTip = lm[1];
    const leftNose = lm[279];
    const rightNose = lm[49];
    const mid: NormalizedLandmark = {
        x: (leftNose.x + rightNose.x) / 2,
        y: (leftNose.y + rightNose.y) / 2,
        z: (leftNose.z + rightNose.z) / 2,
        visibility: 0,
    };
    const perpUp: NormalizedLandmark = { x: mid.x, y: mid.y - 50, z: mid.z, visibility: 0 };
    const yaw = angleBetween(mid, rightNose, noseTip);
    const pitch = angleBetween(mid, noseTip, perpUp);
    return { yaw, pitch, ok: true };
}


function angleBetween(mid: NormalizedLandmark, p1: NormalizedLandmark, p2: NormalizedLandmark) {
    const v1 = { x: p1.x - mid.x, y: p1.y - mid.y };
    const v2 = { x: p2.x - mid.x, y: p2.y - mid.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const m1 = Math.hypot(v1.x, v1.y);
    const m2 = Math.hypot(v2.x, v2.y);
    const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)));
    return (Math.acos(cos) * 180) / Math.PI;
}


export function classifyDirection(yaw: number, pitch: number): Direction {
  // 1) Straight first (center-aware)
  if (isStraight(yaw, pitch)) return "STRAIGHT";

  // 2) Then the coarse direction flags
  const up = pitch < PITCH_UP_THRESHOLD;
  const down = pitch > PITCH_DOWN_THRESHOLD;
  const left = yaw > YAW_LEFT_THRESHOLD;
  const right = yaw < YAW_RIGHT_THRESHOLD;

  if (up && left) return "UP-LEFT";
  if (up && right) return "UP-RIGHT";
  if (down && left) return "DOWN-LEFT";
  if (down && right) return "DOWN-RIGHT";
  if (up) return "UP";
  if (down) return "DOWN";
  if (left) return "LEFT";
  if (right) return "RIGHT";
  return "STRAIGHT";
}

// Optional EMA smoothing
const ema = { yaw: 90, pitch: 90 };
const ALPHA = 0.3; // higher = faster
export function smooth(yaw: number, pitch: number) {
    ema.yaw = ALPHA * yaw + (1 - ALPHA) * ema.yaw;
    ema.pitch = ALPHA * pitch + (1 - ALPHA) * ema.pitch;
    return { yaw: ema.yaw, pitch: ema.pitch };
}