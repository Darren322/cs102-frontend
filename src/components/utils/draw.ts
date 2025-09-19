// src/utils/draw.ts
export type Det = {
  x: number; y: number; w: number; h: number;
  name: string; confidence: number;
};

/**
 * Draw face boxes + labels on a canvas overlay.
 * @param dets Detections from backend
 * @param video The <video> element you're displaying
 * @param canvas The overlay <canvas> on top of the video
 * @param backendW Width the backend used for detection (default 640)
 * @param backendH Height the backend used for detection (default 480)
 */
export function drawDetections(
  dets: Det[],
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  backendW = 640,
  backendH = 480
) {
  const cssW = video.clientWidth || backendW;
  const cssH = video.clientHeight || backendH;

  // match canvas to displayed size
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  // HiDPI crispness
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  // scale from backend coord space → displayed video size
  const scaleX = cssW / backendW;
  const scaleY = cssH / backendH;

  ctx.lineWidth = 2;
  ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  for (const d of dets) {
    const x = d.x * scaleX, y = d.y * scaleY, w = d.w * scaleX, h = d.h * scaleY;

    ctx.strokeStyle = "#22c55e";                    // green-500
    ctx.strokeRect(x, y, w, h);

    const label = `${d.name} ${(d.confidence | 0)}%`;
    const padX = 6;
    const tw = ctx.measureText(label).width;
    const ly = Math.max(0, y - 22);

    ctx.fillStyle = "rgba(34,197,94,0.85)";         // green-500 w/ alpha
    ctx.fillRect(x, ly, tw + padX * 2, 20);

    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + padX, ly + 15);
  }
}
