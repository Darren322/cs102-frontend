import { useEffect, useRef, useState } from "react";
import { drawDetections } from "../components/utils/draw";
import type { Det } from "../components/utils/draw";

/**
 * LiveCam
 * =======
 * Monolithic, high-FPS implementation of:
 *  - Camera capture via getUserMedia
 *  - Binary WebSocket streaming of compressed frames to the backend
 *  - Receiving detections and drawing them on a canvas overlay (imperative)
 *  - Lightweight UI state (FPS, errors, recognized names)
 *
 * Design choices (for performance):
 *  - We keep the hot path IMPERATIVE (no React state on every frame).
 *    WS onmessage → normalize dets → drawDetections(canvas). No re-render needed.
 *  - React state is updated slowly (e.g., FPS every 500ms) or for small, infrequent things (names list).
 *  - A simple "busy" flag prevents overlapping encodes/sends.
 */
export default function LiveCam() {
  // Refs to DOM elements we draw on / read from
  const videoRef = useRef<HTMLVideoElement | null>(null);   // <video> playing the live camera
  const captureRef = useRef<HTMLCanvasElement | null>(null); // hidden <canvas> we draw frames into before encoding
  const overlayRef = useRef<HTMLCanvasElement | null>(null); // on-screen overlay where we draw boxes/labels

  // Top-level UI state
  const [running, setRunning] = useState(false); // toggles WebSocket loop on/off
  const [err, setErr] = useState<string>("");    // user-facing error message

  // Backpressure/loop control (NOT React state to keep hot path fast)
  const busyRef = useRef(false); // true while we are encoding/sending the current frame

  // FPS tracking (we compute per-message cadence and then expose a smoothed UI value)
  const lastTickRef = useRef<number>(performance.now()); // time of last detection message
  const fpsRef = useRef<number>(0);                      // instantaneous FPS computed on each WS message
  const fpsSmoothRef = useRef<number>(0);                // EMA-smoothed FPS (for display)
  const [fpsDisplay, setFpsDisplay] = useState<{ inst: number; avg: number }>({
    inst: 0,
    avg: 0,
  });

  // List of unique recognized names (simple session accumulator)
  const [students, setStudents] = useState<string[]>([]);

  // A single persistent WebSocket connection while "running" is true
  const wsRef = useRef<WebSocket | null>(null);

  /**
   * BACKEND coordinate space
   * ------------------------
   * We capture at this size, send at this size, and the backend returns detections IN THIS SPACE.
   * drawDetections() will scale boxes from (BACKEND_W × BACKEND_H) to the displayed <video> size.
   */
  const BACKEND_W = 640;
  const BACKEND_H = 480;

  /**
   * 1) Start camera once on mount.
   *    - Requests user media at BACKEND_W × BACKEND_H (so we can draw exactly that into the capture canvas).
   *    - On unmount, stops all tracks.
   */
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

  /**
   * 2) Open/close WebSocket when "running" changes.
   *    - Receives detections from server
   *    - Normalizes payload into { x, y, w, h, name, confidence } in BACKEND pixel space
   *    - Imperatively draws using drawDetections (no React state per frame)
   *    - Updates names list & FPS counters
   */
  useEffect(() => {
    if (!running) {
      // If we were running, close and clear the WS reference
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Open a WebSocket (use "wss://" in production behind TLS)
    const ws = new WebSocket("ws://api.attendanceapi.xyz/ws/live-scan");
    wsRef.current = ws;

    ws.onopen = () => {
      setErr(""); // clear any prior error
    };

    ws.onmessage = (event) => {
      try {
        /**
         * Server message format
         * ---------------------
         * We accept either:
         *  A: a plain array:    [{ x, y, w|width, h|height, name?, score?|confidence? }, ...]
         *  B: an envelope:      { dets: [ ...same items... ], ... }
         */
        const payload = JSON.parse(event.data);
        const rawDets: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.dets)
          ? payload.dets
          : [];

        // Normalize to your Det shape IN BACKEND PIXEL SPACE
        const detsForDraw: Det[] = rawDets.map((d) => {
          // Allow both {w,h} and {width,height}
          let x = Number(d.x ?? 0);
          let y = Number(d.y ?? 0);
          let w = Number(d.w ?? d.width ?? 0);
          let h = Number(d.h ?? d.height ?? 0);

          // If values look normalized (0..1), convert to pixels of BACKEND space
          const looksNormalized = x <= 1.5 && y <= 1.5 && w <= 1.5 && h <= 1.5;
          if (looksNormalized) {
            x *= BACKEND_W; y *= BACKEND_H; w *= BACKEND_W; h *= BACKEND_H;
          }

          return {
            x,
            y,
            w,
            h,
            name: d.name ?? "Unknown",
            confidence: d.confidence,
          };
        });

        // Imperative draw — fast path (no React re-render)
        const video = videoRef.current!;
        const overlay = overlayRef.current!;
        drawDetections(detsForDraw, video, overlay, BACKEND_W, BACKEND_H);

        // Update names list (small, occasional mutation)
        setStudents((prev) => {
          const newNames = detsForDraw
            .map((d) => d.name)
            .filter((n) => n && n !== "Unknown");
          return Array.from(new Set([...prev, ...newNames]));
        });

        // FPS: compute instantaneous FPS from message cadence, then smooth with EMA
        const t1 = performance.now();
        const dt = t1 - lastTickRef.current;
        lastTickRef.current = t1;
        const inst = 1000 / Math.max(1, dt);
        fpsRef.current = inst;

        const alpha = 0.2; // smoothing factor for EMA (higher = more reactive)
        fpsSmoothRef.current = fpsSmoothRef.current
          ? fpsSmoothRef.current * (1 - alpha) + inst * alpha
          : inst;
      } catch (e) {
        console.error("WS parse error:", e, event.data);
        setErr("Invalid WS response");
      }
    };

    ws.onerror = () => setErr("WebSocket error");
    ws.onclose = () => { /* closed by server or cleanup */ };

    // Cleanup: close the socket if running toggles off or component unmounts
    return () => {
      try { ws.close(); } catch {}
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [running]);

  /**
   * 3) Capture & send loop
   *    - Pulls the current video frame into the hidden canvas at BACKEND size.
   *    - Encodes to JPEG (quality 0.5) and sends the Blob over the open WebSocket.
   *    - Uses busyRef to avoid overlapping encode/send operations.
   *    - Uses a setTimeout-based loop to roughly target ~33 fps (if backend is fast).
   *
   * Notes:
   *  - We do NOT use React state for the loop; setTimeout is cheaper and predictable here.
   *  - If the socket isn’t open or encode fails, we back off briefly and retry.
   */
  useEffect(() => {
    if (!running) return;
    let timer: number;

    const tick = () => {
      // If we’re still encoding/sending previous frame, try again ASAP
      if (busyRef.current) {
        timer = window.setTimeout(tick, 1);
        return;
      }

      const video = videoRef.current!;
      const cap = captureRef.current!;
      if (!video || !cap || video.readyState < 2) {
        // Camera not ready → wait a bit longer
        timer = window.setTimeout(tick, 60);
        return;
      }

      // Draw current camera frame into the hidden canvas at BACKEND size
      cap.width = BACKEND_W;
      cap.height = BACKEND_H;
      const ctx = cap.getContext("2d")!;
      ctx.drawImage(video, 0, 0, BACKEND_W, BACKEND_H);

      busyRef.current = true;
      cap.toBlob(
        (blob) => {
          if (!blob) {
            // Encode failed → small backoff
            busyRef.current = false;
            timer = window.setTimeout(tick, 100);
            return;
          }
          const ws = wsRef.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            // Socket not ready → backoff slightly
            busyRef.current = false;
            timer = window.setTimeout(tick, 200);
            return;
          }

          // Send Blob directly (no FileReader → lower latency & overhead)
          try {
            ws.send(blob);
          } catch {
            setErr("Send failed");
          } finally {
            // Allow next frame and schedule next iteration
            busyRef.current = false;
            timer = window.setTimeout(tick, 20); // ~33 fps if server is fast; RTT ultimately caps this
          }
        },
        "image/jpeg", // Encoding format; try "image/webp" if your CPU encodes WebP faster
        0.5           // Quality (0..1). Lower → smaller blobs → less bandwidth → possibly higher FPS.
      );
    };

    // Kick off the loop
    tick();

    // Cleanup: stop the loop
    return () => window.clearTimeout(timer);
  }, [running]);

  /**
   * 4) FPS display heartbeat
   *    - Updates the visible FPS numbers every 500 ms using smoothed refs.
   *    - This avoids re-rendering the whole component on each frame.
   */
  useEffect(() => {
    const id = window.setInterval(() => {
      setFpsDisplay({ inst: fpsRef.current, avg: fpsSmoothRef.current });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-row">
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Live Camera (frontend overlay)</h2>

        {/* Controls + status (very cheap to re-render) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning((s) => !s)}
            className={`px-3 py-2 rounded text-white ${running ? "bg-red-600" : "bg-green-600"}`}
          >
            {running ? "Stop" : "Start"}
          </button>

          {/* FPS readout (updates every 500ms) */}
          <span className="text-sm text-gray-700">
            FPS: {fpsDisplay.inst.toFixed(1)}{" "}
            <span className="text-gray-400">(avg {fpsDisplay.avg.toFixed(1)})</span>
          </span>

          {/* Shows while encode/send is in progress for the current frame */}
          {busyRef.current && <span className="text-sm text-gray-500">processing…</span>}

          {/* User-facing error message from camera/WS */}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        {/* Video + overlay canvas.
            The overlay canvas is drawn IMPERATIVELY in ws.onmessage via drawDetections(). */}
        <div className="relative inline-block">
          {/* Explicit width/height ensure video.clientWidth/Height are correct for drawDetections scaling */}
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

        {/* Hidden capture canvas used to encode frames before sending */}
        <canvas ref={captureRef} className="hidden" />
      </div>

      {/* Simple table of unique recognized names for this session */}
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
