// src/utils/draw.ts
export type Det = {
  x: number; y: number; w: number; h: number;
  name: string; confidence: number;
};

let lastDets: { dets: Det[]; ts: number } = { dets: [], ts: 0 };

/**
 * Draw face boxes + labels on a canvas overlay.
 * Keeps last detections alive for ~300ms to avoid flashing.
 */
export function drawDetections(
  dets: Det[] | null,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  backendW = 640,
  backendH = 480
) {
  const cssW = video.clientWidth || backendW;
  const cssH = video.clientHeight || backendH;

  // match canvas size to video
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  // HiDPI crispness
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, cssW, cssH);

  // update cache if new dets provided
  if (dets && dets.length > 0) {
    lastDets = { dets, ts: performance.now() };
  }

  // if last detections are recent (<300ms), reuse them
  const now = performance.now();
  const showDets =
    now - lastDets.ts < 300 ? lastDets.dets : [];

  // scale backend → display size
  const scaleX = cssW / backendW;
  const scaleY = cssH / backendH;

  ctx.lineWidth = 2;
  ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  for (const d of showDets) {
    const x = d.x * scaleX;
    const y = d.y * scaleY;
    const w = d.w * scaleX;
    const h = d.h * scaleY;

    ctx.strokeStyle = "#22c55e"; // green
    ctx.strokeRect(x, y, w, h);

    const label = `${d.name} ${(d.confidence | 0)}%`;
    const padX = 6;
    const tw = ctx.measureText(label).width;
    const ly = Math.max(0, y - 22);

    ctx.fillStyle = "rgba(34,197,94,0.85)";
    ctx.fillRect(x, ly, tw + padX * 2, 20);

    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + padX, ly + 15);
  }
}
