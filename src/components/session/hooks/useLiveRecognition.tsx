import * as React from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAttendance } from "../AttendanceProvider";

const WIDTH = 640, HEIGHT = 480;
const WS_BASE = "ws://localhost:8081/ws/live-scan";

/**
 * Live recognition hook with:
 * - Local preview until server frames arrive
 * - WebSocket guarded against StrictMode loops
 * - Frame send loop
 * - DETECTION BUFFER with 5s flush (de-dupe + cooldown) -> actions.autoMark()
 */
export function useLiveRecognition(deviceId?: string) { // 👈 ADD deviceId parameter
  const { id: routeSessionId } = useParams();
  const { sessionMeta, actions } = useAttendance();

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const captureRef = React.useRef<HTMLCanvasElement | null>(null);
  const serverImgRef = React.useRef<HTMLImageElement | null>(null);

  const [running, setRunning] = React.useState(false);
  const [fps, setFps] = React.useState(0);
  const [serverFps, setServerFps] = React.useState(0);
  const [serverReady, setServerReady] = React.useState(false);

  const wsRef = React.useRef<WebSocket | null>(null);
  const sendLoopActiveRef = React.useRef(false);
  const busyRef = React.useRef(false);

  const frameCountRef = React.useRef(0);
  const fpsIntervalRef = React.useRef<number | null>(null);

  const recvCountRef = React.useRef(0);
  const recvFpsIntervalRef = React.useRef<number | null>(null);

  const lastUrlRef = React.useRef<string | null>(null);

  // ---- NEW: buffer + cooldown for batched autoMark ----
  const detBufferRef = React.useRef<any[]>([]);
  const lastSentAtRef = React.useRef<Map<string, number>>(new Map()); // studentId -> timestamp
  const FLUSH_MS = 5000;                  // match your original 5s interval
  const COOLDOWN_MS = 30_000;             // avoid re-sending the same student too often (30s)
  // -----------------------------------------------------

  // keep latest actions without retriggering effects
  const actionsRef = React.useRef(actions);
  React.useEffect(() => { actionsRef.current = actions; }, [actions]);

  // 👇 UPDATED: Local preview boot with deviceId support
  React.useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        // Build constraints based on deviceId
        const constraints = deviceId
          ? { video: { deviceId: { exact: deviceId }, width: WIDTH, height: HEIGHT }, audio: false }
          : { video: { width: WIDTH, height: HEIGHT, facingMode: "user" }, audio: false };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const v = videoRef.current!;
        try { await v.pause(); } catch {}
        v.srcObject = null;
        v.srcObject = stream;
        (v as any).playsInline = true;
        v.muted = true;
        await new Promise<void>((resolve) => {
          const onMeta = () => { v.removeEventListener("loadedmetadata", onMeta); resolve(); };
          if ((v as any).readyState >= 1) resolve();
          else v.addEventListener("loadedmetadata", onMeta, { once: true });
        });
        await v.play();
      } catch (e: any) {
        toast.error(String(e?.message ?? e));
      }
    })();
    return () => {
      cancelled = true;
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach(t => t.stop());
    };
  }, [deviceId]); // 👈 Re-run when deviceId changes

  // WebSocket receive
  React.useEffect(() => {
    if (!running) {
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
      if (lastUrlRef.current) { URL.revokeObjectURL(lastUrlRef.current); lastUrlRef.current = null; }
      if (recvFpsIntervalRef.current != null) { clearInterval(recvFpsIntervalRef.current); recvFpsIntervalRef.current = null; }
      setServerFps(0);
      setServerReady(false);
      // clear buffers when stopping
      detBufferRef.current = [];
      lastSentAtRef.current.clear();
      return;
    }

    const backendSessionId = sessionMeta?.sessionID;
    if (!backendSessionId) { toast.error("Backend session is not ready."); return; }
    if (wsRef.current) return; // StrictMode guard

    const url = `${WS_BASE}?sessionId=${encodeURIComponent(backendSessionId)}`;
    const ws = new WebSocket(url);
    ws.binaryType = "blob";
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "hello", sessionId: routeSessionId, mode: "live" }));
    };
    ws.onerror = () => toast.error("WebSocket error");

    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") {
        // Annotated JPEG frame from server
        recvCountRef.current += 1;
        const url = URL.createObjectURL(ev.data as Blob);
        const imgEl = serverImgRef.current;
        if (imgEl) {
          if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
          imgEl.src = url;
          lastUrlRef.current = url;
          if (!serverReady) setServerReady(true);
        } else {
          URL.revokeObjectURL(url);
        }
        return;
      }

      // JSON control / detections
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "dets" && Array.isArray(msg.dets)) {
          // PUSH to buffer (don't call API yet)
          detBufferRef.current.push(...msg.dets);
        }
        // If you later add present/left handling to actions, wire them here (buffered or immediate).
      } catch {
        /* ignore parse errors */
      }
    };

    // Server FPS ticker
    recvFpsIntervalRef.current = window.setInterval(() => {
      setServerFps(recvCountRef.current);
      recvCountRef.current = 0;
    }, 1000) as unknown as number;

    return () => {
      try { ws.close(); } catch {}
      if (wsRef.current === ws) wsRef.current = null;
      if (lastUrlRef.current) { URL.revokeObjectURL(lastUrlRef.current); lastUrlRef.current = null; }
      if (recvFpsIntervalRef.current != null) { clearInterval(recvFpsIntervalRef.current); recvFpsIntervalRef.current = null; }
      setServerFps(0);
      setServerReady(false);
      // clear buffers on disconnect
      detBufferRef.current = [];
      lastSentAtRef.current.clear();
    };
  }, [running, sessionMeta.sessionID, routeSessionId]);

  // ---- NEW: periodic flush -> actions.autoMark(payload) every 5s ----
  React.useEffect(() => {
    if (!running) return;

    const flush = async () => {
      const now = Date.now();
      const buf = detBufferRef.current;
      if (!buf.length) return;

      // Take and clear buffer
      detBufferRef.current = [];

      // Normalize & filter
      const cleaned = buf
        .map((d: any) => ({
          name: (d?.name ?? d?.studentId ?? "").toString().trim(),
          confidence: Number.isFinite(d?.confidence) ? d.confidence : 0,
        }))
        .filter((d) => d.name && d.name.toLowerCase() !== "unknown" && d.confidence >= 80);

      if (!cleaned.length) return;

      // Unique by name (keep highest confidence)
      const uniqueByName: Record<string, { name: string; confidence: number }> = {};
      for (const d of cleaned) {
        const cur = uniqueByName[d.name];
        if (!cur || d.confidence > cur.confidence) uniqueByName[d.name] = d;
      }

      // Cooldown filter to avoid repeat posts
      const recent = lastSentAtRef.current;
      const payload = Object.values(uniqueByName)
        .filter(({ name }) => {
          const last = recent.get(name) ?? 0;
          return now - last >= COOLDOWN_MS;
        })
        .map(({ name, confidence }) => ({
          studentId: name,
          confidence,
          timestamp: new Date().toISOString(),
          recordedBy: localStorage["username"],
        }));

      if (!payload.length) return;

      try {
        await actionsRef.current.autoMark(payload);
        // Update last-sent timestamps
        for (const p of payload) recent.set(p.studentId, now);
      } catch (e) {
        // On failure, you could requeue if you want:
        // detBufferRef.current.push(...payload.map(p => ({ name: p.studentId, confidence: p.confidence })));
        toast.error(String(e));
      }
    };

    const id = window.setInterval(flush, FLUSH_MS) as unknown as number;
    return () => { clearInterval(id); };
  }, [running]);
  // -------------------------------------------------------------------

  // Send loop
  React.useEffect(() => {
    if (!running) {
      if (fpsIntervalRef.current != null) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
      sendLoopActiveRef.current = false;
      setFps(0);
      return;
    }
    if (sendLoopActiveRef.current) return;

    sendLoopActiveRef.current = true;

    fpsIntervalRef.current = window.setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000) as unknown as number;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;

      const cap = captureRef.current!;
      const video = videoRef.current!;
      const ws = wsRef.current;

      if (!ws || ws.readyState !== WebSocket.OPEN) return void setTimeout(tick, 50);
      if (!video || video.readyState < 2) return void setTimeout(tick, 60);
      if (busyRef.current) return void setTimeout(tick, 1);

      const vw = (video as any).videoWidth || WIDTH;
      const vh = (video as any).videoHeight || HEIGHT;
      cap.width = vw; cap.height = vh;

      const ctx = cap.getContext("2d")!;
      ctx.drawImage(video, 0, 0, cap.width, cap.height);
      busyRef.current = true;

      cap.toBlob(
        (blob) => {
          busyRef.current = false;
          if (!blob || !blob.size) return void setTimeout(tick, 10);
          if (!ws || ws.readyState !== WebSocket.OPEN) return void setTimeout(tick, 50);
          if (ws.bufferedAmount > 2_000_000) return void setTimeout(tick, 10);
          try {
            ws.send(JSON.stringify({ type: "frame" }));
            ws.send(blob);
            frameCountRef.current += 1;
          } catch {
            toast.error("Send failed");
          } finally {
            setTimeout(tick, 5);
          }
        },
        "image/jpeg",
        0.85
      );
    };

    setTimeout(tick, 0);
    return () => {
      cancelled = true;
      sendLoopActiveRef.current = false;
      if (fpsIntervalRef.current != null) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
      setFps(0);
    };
  }, [running]);

  return {
    refs: { videoRef, captureRef, serverImgRef },
    running,
    setRunning,
    stats: { fps, serverFps },
    ui: { serverReady },
  } as const;
}