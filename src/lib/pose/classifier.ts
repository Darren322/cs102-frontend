import type { Boundaries } from "./calibration";

export type Direction =
  | "UP"|"DOWN"|"LEFT"|"RIGHT"
  | "UP-LEFT"|"UP-RIGHT"|"DOWN-LEFT"|"DOWN-RIGHT"
  | "STRAIGHT"|"NO_FACE";

const ALPHA = 0.3;  // EMA smoothing
let ema = { yaw: 0, pitch: 0, initialized: false };
const HYST = 4;     // degrees
const HOLD = 3;     // frames to confirm switch
let lastDir: Direction = "STRAIGHT";
let holdCount = 0;

function classifyOnce(yaw:number, pitch:number, B: Boundaries): Direction {
  const isLeft  = yaw < B.yaw.left_vs_straight - HYST;
  const isRight = yaw > B.yaw.straight_vs_right + HYST;
  const isUp    = pitch < B.pitch.up_vs_straight - HYST;
  const isDown  = pitch > B.pitch.straight_vs_down + HYST;

  if (isUp && isLeft) return "UP-LEFT";
  if (isUp && isRight) return "UP-RIGHT";
  if (isDown && isLeft) return "DOWN-LEFT";
  if (isDown && isRight) return "DOWN-RIGHT";
  if (isLeft) return "LEFT";
  if (isRight) return "RIGHT";
  if (isUp) return "UP";
  if (isDown) return "DOWN";
  return "STRAIGHT";
}

export function classify(yaw:number, pitch:number, B?: Boundaries): Direction {
  if (!B) return "NO_FACE";
  if (!ema.initialized){ ema = { yaw, pitch, initialized:true }; }
  ema.yaw = ALPHA*yaw + (1-ALPHA)*ema.yaw;
  ema.pitch = ALPHA*pitch + (1-ALPHA)*ema.pitch;

  const current = classifyOnce(ema.yaw, ema.pitch, B);
  if (current === lastDir) { holdCount = 0; return lastDir; }
  if (++holdCount >= HOLD) { lastDir = current; holdCount = 0; }
  return lastDir;
}
