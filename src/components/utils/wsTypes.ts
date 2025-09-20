// Shapes the server may send (be liberal in what we accept).
export type ServerDet =
  | { x: number; y: number; w: number; h: number; name?: string; confidence?: number; score?: number }
  | { x: number; y: number; width: number; height: number; name?: string; confidence?: number; score?: number }
  | { rect: { x: number; y: number; width?: number; height?: number; w?: number; h?: number }; name?: string; confidence?: number; score?: number };

export type ServerMsg =
  | { type: "dets"; seq?: number; dets: ServerDet[] }
  | { type: "error"; msg: string }
  | ServerDet[]; // legacy: plain array

/**
 * Normalize any server det shape into your drawing Det (pixels in backend space).
 * If the server sends normalized coords (0..1), expand to pixels using backendW/H.
 */
export function normalizeServerDets(raw: unknown, backendW: number, backendH: number) {
  const array: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.dets)
    ? (raw as any).dets
    : [];

  return array.map((d) => {
    const r = d.rect ?? d;
    let x = Number(r.x ?? 0);
    let y = Number(r.y ?? 0);
    let w = Number(r.w ?? r.width ?? 0);
    let h = Number(r.h ?? r.height ?? 0);

    // Expand normalized 0..1 to pixels if it looks normalized.
    const looksNormalized = x <= 1.5 && y <= 1.5 && w <= 1.5 && h <= 1.5;
    if (looksNormalized) {
      x *= backendW; y *= backendH; w *= backendW; h *= backendH;
    }

    const name = (d.name ?? r.name ?? "Unknown") as string;
    
    const confidence = d.confidence;

    return { x, y, w, h, name, confidence };
  });
}
