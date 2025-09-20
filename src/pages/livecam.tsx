import { useEffect, useRef, useState } from "react";
import { drawDetections } from "../components/utils/draw";
import type { Det } from "../components/utils/draw";

/**
 * LiveCam with client-side smoothing
 * ----------------------------------
 * - Streams camera frames → backend (WebP)
 * - Receives detections
 * - Smoothly interpolates (lerp) boxes each rAF so motion looks fluid
 * - Shows "Effective FPS" = how often the *target* boxes change meaningfully
 */

export default function LiveCam() {
  // DOM refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // UI
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string>("");
  const [students, setStudents] = useState<string[]>([]);
  const [effFps, setEffFps] = useState<number>(0); // perceived FPS (changes/sec)

  // Backend capture/detection space
  const BACKEND_W = 640;
  const BACKEND_H = 480;

  // Hot-path refs
  const wsRef = useRef<WebSocket | null>(null);
  const busyRef = useRef(false);

  // Target detections from server (jump in steps)
  const targetDetsRef = useRef<Det[]>([]);
  // Smoothed detections we actually draw (updated every rAF)
  const smoothDetsRef = useRef<Det[]>([]);
  // Track when target actually changes → effective FPS
  const changeTimesRef = useRef<number[]>([]);
  const lastSigRef = useRef<string>(""); // signature to detect meaningful changes

  // --- helpers ---
  const detsSignature = (dets: Det[]) =>
    dets
      .map(d => {
        const r = (v: number) => Math.round(v); // 1px granularity to catch small moves
        return `${d.name}:${r(d.x)},${r(d.y)},${r(d.w)},${r(d.h)}`;
      })
      .join("|");

  // linear interpolation
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // pair up two arrays of dets by (name + nearest center) to lerp correctly
  function matchDets(prev: Det[], next: Det[]): Array<{ p: Det; n: Det }> {
    const used = new Set<number>();
    const out: Array<{ p: Det; n: Det }> = [];
    for (const p of prev) {
      let bestI = -1;
      let bestD = Infinity;
      const px = p.x + p.w * 0.5, py = p.y + p.h * 0.5;
      for (let i = 0; i < next.length; i++) {
        if (used.has(i)) continue;
        const n = next[i];
        if (n.name !== p.name) continue; // prefer same identity
        const nx = n.x + n.w * 0.5, ny = n.y + n.h * 0.5;
        const d = (nx - px) * (nx - px) + (ny - py) * (ny - py);
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      if (bestI >= 0) {
        used.add(bestI);
        out.push({ p, n: next[bestI] });
      }
    }
    // Add unmatched new dets (appear smoothly from nothing)
    next.forEach((n, i) => {
      if (!Array.from(used).includes(i)) {
        out.push({ p: { ...n }, n });
      }
    });
    return out;
  }

  // ==== 1) camera ====
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: BACKEND_W, height: BACKEND_H, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setErr(String(e));
      }
    })();
    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
    };
  }, []);

  // ==== 2) websocket (recv) ====
  useEffect(() => {
    if (!running) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }
    const ws = new WebSocket("wss://api.attendanceapi.xyz/ws/live-scan");
    wsRef.current = ws;

    ws.onopen = () => setErr("");

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.dets) ? payload.dets : [];

        const dets: Det[] = raw.map((d) => {
          let x = Number(d.x ?? 0), y = Number(d.y ?? 0);
          let w = Number(d.w ?? d.width ?? 0), h = Number(d.h ?? d.height ?? 0);
          if (x <= 1.5 && y <= 1.5 && w <= 1.5 && h <= 1.5) {
            x *= BACKEND_W; y *= BACKEND_H; w *= BACKEND_W; h *= BACKEND_H;
          }
          return { x, y, w, h, name: d.name ?? "Unknown", confidence: d.confidence ?? 0 };
        });

        // Update names (cheap)
        setStudents((prev) => {
          const nn = dets.map(d => d.name).filter(n => n && n !== "Unknown");
          return Array.from(new Set([...prev, ...nn]));
        });

        // If target changed meaningfully, record a change for eff-FPS
        const sig = detsSignature(dets);
        if (sig !== lastSigRef.current) {
          changeTimesRef.current.push(performance.now());
          if (changeTimesRef.current.length > 200) {
            changeTimesRef.current.splice(0, changeTimesRef.current.length - 200);
          }
          lastSigRef.current = sig;
        }

        targetDetsRef.current = dets;
        // Initialize smoother on first frame
        if (smoothDetsRef.current.length === 0) {
          smoothDetsRef.current = dets.map(d => ({ ...d }));
        }
      } catch (e) {
        console.error("WS parse error:", e, event.data);
        setErr("Invalid WS response");
      }
    };

    ws.onerror = () => setErr("WebSocket error");
    ws.onclose = () => {};

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [running]);

  // ==== 3) capture+send (tx) ====
  
// put this near your other refs, at the top of the component:
const seqRef = useRef<number>(1);

  useEffect(() => {
  if (!running) return;
  let timer: number;

  const tick = () => {
    if (busyRef.current) {
      timer = window.setTimeout(tick, 1);
      return;
    }
    const video = videoRef.current!;
    const cap = captureRef.current!;
    if (!video || !cap || video.readyState < 2) {
      timer = window.setTimeout(tick, 60);
      return;
    }

    // ✅ use actual video dimensions (guards against 0×0 during light/torch changes)
    const vw = (video as any).videoWidth || BACKEND_W;
    const vh = (video as any).videoHeight || BACKEND_H;
    if (!vw || !vh) {               // no real frame yet
      timer = window.setTimeout(tick, 60);
      return;
    }

    cap.width = vw;
    cap.height = vh;
    const ctx = cap.getContext("2d")!;
    ctx.drawImage(video, 0, 0, cap.width, cap.height);

    busyRef.current = true;
    cap.toBlob(
      (blob) => {
        busyRef.current = false;
        if (!blob || !blob.size) {
          timer = window.setTimeout(tick, 20);
          return;
        }
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          timer = window.setTimeout(tick, 50);
          return;
        }
        // (optional) backpressure: skip if socket buffer is huge
        if (ws.bufferedAmount > 2_000_000) {
          timer = window.setTimeout(tick, 10);
          return;
        }

        try {
          // ✅ send a small JSON header first so the server sets seq
          const seq = seqRef.current++;
          ws.send(JSON.stringify({ type: "frame", seq }));
          console.log(blob)
          // ✅ then send the actual JPEG bytes
          ws.send(blob);
          // console.log("blob bytes:", blob.size, "seq:", seq);
        } catch {
          setErr("Send failed");
        } finally {
          timer = window.setTimeout(tick, 10);
        }
      },
      // ✅ JPEG is reliably decodable by OpenCV
      "image/jpeg",
      0.4
    );
  };

  tick();
  return () => window.clearTimeout(timer);
}, [running]);

  // ==== 4) draw (rAF) with smoothing + effective FPS calc ====
  useEffect(() => {
    let rafId = 0;
    let lastT = performance.now();

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000)); // cap dt to avoid jumps (>50ms)
      lastT = now;

      // Smooth towards target at a time-constant (50–120ms feels nice).
      // Convert desired smoothing half-life into per-frame alpha.
      // Here we use ~80ms time-constant: alpha = 1 - exp(-dt/τ)
      const tau = 0.08; // seconds (lower = snappier, higher = smoother)
      const alpha = 1 - Math.exp(-dt / tau);

      const target = targetDetsRef.current;
      let smooth = smoothDetsRef.current;

      // If counts differ, rematch by (name+nearest center)
      const pairs = matchDets(smooth, target);

      // lerp each matched box
      const out: Det[] = pairs.map(({ p, n }) => ({
        x: lerp(p.x, n.x, alpha),
        y: lerp(p.y, n.y, alpha),
        w: lerp(p.w, n.w, alpha),
        h: lerp(p.h, n.h, alpha),
        name: n.name,
        confidence: n.confidence,
      }));

      // Draw smoothed boxes
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (video && overlay) {
        drawDetections(out, video, overlay, BACKEND_W, BACKEND_H);
      }

      smoothDetsRef.current = out;

      // once/sec -> effective FPS (changes/sec)
      // trim timestamps older than 1s
      if ((now | 0) % 1000 < 16) {
        const cutoff = now - 1000;
        const arr = changeTimesRef.current;
        let i = 0;
        while (i < arr.length && arr[i] < cutoff) i++;
        if (i) arr.splice(0, i);
        setEffFps(arr.length);
      }
    };

    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ==== UI ====
  return (
    <div className="flex flex-row">
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Live Camera (smoothed)</h2>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning(s => !s)}
            className={`px-3 py-2 rounded text-white ${running ? "bg-red-600" : "bg-green-600"}`}
          >
            {running ? "Stop" : "Start"}
          </button>
          <span className="text-sm text-gray-700">Effective FPS: {effFps}</span>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        <div className="relative inline-block">
          <video
            ref={videoRef}
            width={BACKEND_W}
            height={BACKEND_H}
            className="rounded border"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={overlayRef}
            className="absolute left-0 top-0 pointer-events-none"
            style={{ zIndex: 1 }}
          />
        </div>

        <canvas ref={captureRef} className="hidden" />
      </div>

      <table className="mt-4 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-1">#</th>
            <th className="border border-gray-300 px-3 py-1">Student Name</th>
          </tr>
        </thead>
        <tbody>
          {students.map((name, idx) => (
            <tr key={name}>
              <td className="border border-gray-300 px-3 py-1">{idx + 1}</td>
              <td className="border border-gray-300 px-3 py-1">{name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
