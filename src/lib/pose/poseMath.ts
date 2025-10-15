import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
type V3 = { x:number; y:number; z:number };
const mid = (a: V3, b: V3): V3 => ({ x:(a.x+b.x)/2, y:(a.y+b.y)/2, z:(a.z+b.z)/2 });
const deg = (r:number)=> r*180/Math.PI;

/** Returns yaw (right +) and pitch (down +) in degrees. */
export function estimateYawPitch(lm?: NormalizedLandmark[]) {
  if (!lm) return { yaw: 0, pitch: 0, ok: false };
  const NOSE=lm[1], L=lm[234] ?? lm[33], R=lm[454] ?? lm[263], CHIN=lm[152], FOREHEAD=lm[10] ?? lm[8];
  if (!NOSE || !L || !R || !CHIN || !FOREHEAD) return { yaw:0, pitch:0, ok:false };
  const earsMid = mid(L, R);
  const vYaw = { x: NOSE.x - earsMid.x, z: NOSE.z - earsMid.z };
  const yaw = deg(Math.atan2(vYaw.x, -vYaw.z));
  const vPitch = { y: FOREHEAD.y - CHIN.y, z: FOREHEAD.z - CHIN.z };
  const pitch = deg(Math.atan2(vPitch.y, -vPitch.z));
  return { yaw, pitch, ok: true };
}
