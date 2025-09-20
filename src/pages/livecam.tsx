import { useEffect, useRef, useState } from "react";
import { drawDetections } from "../components/utils/draw";
import type { Det } from "../components/utils/draw";

/**
 * LiveCam
 * =======
 * Frontend for real-time face recognition:
 *  - Captures camera frames with getUserMedia()
 *  - Streams frames to backend via WebSocket (binary WebP blobs)
 *  - Backend runs detection and sends JSON with bounding boxes
 *  - Overlay is drawn on <canvas> using requestAnimationFrame
 *  - FPS is measured as "how many NEW detection frames arrive per second"
 */
export default function LiveCam() {
  // === DOM element refs (imperative handles, not state) ===
  const videoRef = useRef<HTMLVideoElement | null>(null);   // <video> showing live camera
  const captureRef = useRef<HTMLCanvasElement | null>(null); // hidden canvas to encode frames
  const overlayRef = useRef<HTMLCanvasElement | null>(null); // overlay canvas to draw boxes

  // === UI state (React state → re-renders UI when changed) ===
  const [running, setRunning] = useState(false); // start/stop stream
  const [err, setErr] = useState<string>("");    // error messages
  const [students, setStudents] = useState<string[]>([]); // recognized names
  const [fps, setFps] = useState<number>(0);     // measured backend FPS

  // === Backend capture size (fixed) ===
  const BACKEND_W = 640;
  const BACKEND_H = 480;

  // === Non-state refs (do NOT trigger re-renders) ===
  const busyRef = useRef(false);                 // true while encoding/sending
  const wsRef = useRef<WebSocket | null>(null);  // active WebSocket
  const latestDetsRef = useRef<Det[] & { seq?: number }>([]); // buffer latest detections

  /** 1) Camera setup — run once on mount */
  useEffect(() => {
    (async () => {
      try {
        // Request user camera at backend resolution
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

    // Cleanup: stop camera tracks when component unmounts
    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
    };
  }, []);

  /** 2) WebSocket setup (open on start, close on stop) */
  useEffect(() => {
    if (!running) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    // IMPORTANT: use wss:// in production
    const ws = new WebSocket("wss://api.attendanceapi.xyz/ws/live-scan");
    wsRef.current = ws;

    ws.onopen = () => setErr("");

    ws.onmessage = (event) => {
      try {
        // Parse backend response
        const payload = JSON.parse(event.data);
        const seq = payload.seq ?? performance.now(); // unique frame id
        const rawDets: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.dets)
          ? payload.dets
          : [];

        // Normalize to Det[]
        const detsForDraw: Det[] = rawDets.map((d) => {
          let x = Number(d.x ?? 0);
          let y = Number(d.y ?? 0);
          let w = Number(d.w ?? d.width ?? 0);
          let h = Number(d.h ?? d.height ?? 0);

          // If numbers look normalized (0..1), scale to backend pixels
          if (x <= 1.5 && y <= 1.5 && w <= 1.5 && h <= 1.5) {
            x *= BACKEND_W; y *= BACKEND_H; w *= BACKEND_W; h *= BACKEND_H;
          }
          return { x, y, w, h, name: d.name ?? "Unknown", confidence: d.confidence };
        });

        // Attach seq so drawing loop can tell if frame is new
        (detsForDraw as any).seq = seq;
        latestDetsRef.current = detsForDraw;

        // Update recognized names
        setStudents((prev) => {
          const newNames = detsForDraw
            .map((d) => d.name)
            .filter((n) => n && n !== "Unknown");
          return Array.from(new Set([...prev, ...newNames]));
        });
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

  /** 3) Capture + send loop (encode → send blob) */
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

      // Draw video frame into hidden canvas
      cap.width = BACKEND_W;
      cap.height = BACKEND_H;
      const ctx = cap.getContext("2d")!;
      ctx.drawImage(video, 0, 0, BACKEND_W, BACKEND_H);

      busyRef.current = true;
      cap.toBlob(
        (blob) => {
          busyRef.current = false;
          if (!blob) {
            timer = window.setTimeout(tick, 30);
            return;
          }
          const ws = wsRef.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            timer = window.setTimeout(tick, 100);
            return;
          }
          try {
            ws.send(blob); // send compressed frame
          } catch {
            setErr("Send failed");
          } finally {
            timer = window.setTimeout(tick, 10); // next iteration
          }
        },
        "image/webp", // WebP usually faster + smaller than JPEG
        0.5           // quality (0..1)
      );
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [running]);

  /** 4) Drawing loop (requestAnimationFrame) + FPS measurement */
  useEffect(() => {
    let rafId: number;
    let frames = 0;
    let lastSeq: number | null = null;
    let lastFpsUpdate = performance.now();

    const loop = () => {
      rafId = requestAnimationFrame(loop);

      const video = videoRef.current;
      const overlay = overlayRef.current;
      const dets = latestDetsRef.current;

      if (video && overlay) {
        drawDetections(dets, video, overlay, BACKEND_W, BACKEND_H);
      }

      // Count only when backend seq changes (new frame)
      const currentSeq = (dets as any)?.seq ?? null;
      if (currentSeq !== null && currentSeq !== lastSeq) {
        frames++;
        lastSeq = currentSeq;
      }

      // Update FPS once per second
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(frames);
        frames = 0;
        lastFpsUpdate = now;
      }
    };

    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // === UI rendering ===
  return (
    <div className="flex flex-row">
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Live Camera (frontend overlay)</h2>

        {/* Controls + FPS display */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning((s) => !s)}
            className={`px-3 py-2 rounded text-white ${running ? "bg-red-600" : "bg-green-600"}`}
          >
            {running ? "Stop" : "Start"}
          </button>

          <span className="text-sm text-gray-700">FPS: {fps}</span>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        {/* Video with overlay canvas */}
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

        {/* Hidden capture canvas */}
        <canvas ref={captureRef} className="hidden" />
      </div>

      {/* Table of recognized students */}
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
