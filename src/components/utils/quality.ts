import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const TOO_DARK_THRESHOLD = 60;
export const TOO_BRIGHT_THRESHOLD = 200;

export const getFrameBrightness = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let colorSum = 0;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    colorSum += avg;
  }
  return Math.floor(colorSum / (canvas.width * canvas.height));
};

export const isTooDarkOrTooBright = (canvas?: HTMLCanvasElement) => {
  let isTooDark = false, isTooBright = false;
  if (!canvas) return { isTooDark, isTooBright };
  const b = getFrameBrightness(canvas);
  if (b == null) return { isTooDark, isTooBright };
  if (b < TOO_DARK_THRESHOLD) isTooDark = true;
  else if (b > TOO_BRIGHT_THRESHOLD) isTooBright = true;
  return { isTooDark, isTooBright };
};

export const isMultipleFaces = (result?: { faceLandmarks?: any[] }) =>
  !!(result && Array.isArray(result.faceLandmarks) && result.faceLandmarks.length > 1);

export function isFaceCutOffScreen(
  faceLandmarks: NormalizedLandmark[],
  imgW: number,
  imgH: number
): boolean {
  for (const lm of faceLandmarks) {
    const x = Math.round(lm.x * imgW);
    const y = Math.round(lm.y * imgH);
    if (x <= 0 || x >= imgW || y <= 0 || y >= imgH) return true;
  }
  return false;
}

// Distance helpers
const dist2 = (x1:number,y1:number,x2:number,y2:number)=>Math.hypot(x2-x1,y2-y1);

export function isFaceTooFar(
  lm: NormalizedLandmark[],
  imgW: number,
  imgH: number,
  threshold = 300
): boolean {
  const L = lm[33], R = lm[263];
  if (!L || !R) return false;
  const d = dist2(L.x * imgW, L.y * imgH, R.x * imgW, R.y * imgH);
  return d < threshold;
}
export function isFaceTooClose(
  lm: NormalizedLandmark[],
  imgW: number,
  imgH: number,
  threshold = 370
): boolean {
  const L = lm[33], R = lm[263];
  if (!L || !R) return false;
  const d = dist2(L.x * imgW, L.y * imgH, R.x * imgW, R.y * imgH);
  return d > threshold;
}
