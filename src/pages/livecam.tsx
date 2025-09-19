import { useEffect, useRef, useState } from "react";
import { drawDetections } from "../components/utils/draw";
import type { Det } from "../components/utils/draw";

export default function LiveCam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string>("");

  // in-flight guard (doesn't trigger React renders)
  const busyRef = useRef(false);

  // FPS tracking (refs for fast updates, state for infrequent UI)
  const lastTickRef = useRef<number>(performance.now());
  const fpsRef = useRef<number>(0);
  const fpsSmoothRef = useRef<number>(0);
  const [fpsDisplay, setFpsDisplay] = useState<{ inst: number; avg: number }>({ inst: 0, avg: 0 });
    const [students, setStudents] = useState<string[]>([]);
  // 1) Start/stop camera
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        
      }
    })();

    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
    };
  }, []);

  // 2) Update the visible FPS at a gentle cadence (every 500ms)
  useEffect(() => {
    const id = window.setInterval(() => {
      setFpsDisplay({ inst: fpsRef.current, avg: fpsSmoothRef.current });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  // 3) Capture + send loop
  useEffect(() => {
    if (!running) return;
    let timer: number;

    const tick = async () => {
      if (busyRef.current) {
        timer = window.setTimeout(tick, 40);
        return;
      }

      const video = videoRef.current!;
      const cap = captureRef.current!;
      const overlay = overlayRef.current!;
      if (!video || !cap || !overlay || video.readyState < 2) {
        timer = window.setTimeout(tick, 60);
        return;
      }

      // capture at fixed size matching backend expectation
      const W = 640, H = 480;
      cap.width = W; cap.height = H;
      const ctx = cap.getContext("2d")!;
      ctx.drawImage(video, 0, 0, cap.width, cap.height);

      busyRef.current = true;
      cap.toBlob(async (blob) => {
        if (!blob) {
          busyRef.current = false;
          timer = window.setTimeout(tick, 100);
          return;
        }

      
        try {
          const form = new FormData();
          form.append("image", blob, "frame.jpg");

          const res = await fetch("http://112.199.250.89:8081/api/recognition/live-scan", {
            method: "POST",
            body: form,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const dets: Det[] = await res.json();

          // draw using util (no React re-render)
          drawDetections(dets, video, overlay, W, H);
          setStudents(prev => {
            const newNames = dets
                .map(d => d.name)
                .filter(name => name && name !== "Unknown");

            // merge with previous, avoiding duplicates
            const merged = new Set([...prev, ...newNames]);
            return Array.from(merged);
            });
          // FPS calc (round-trip)
          const t1 = performance.now();
          const dt = t1 - lastTickRef.current;
          lastTickRef.current = t1;

          const inst = 1000 / Math.max(1, dt);
          fpsRef.current = inst;

          // EMA smoothing
          const alpha = 0.2;
          fpsSmoothRef.current = fpsSmoothRef.current
            ? fpsSmoothRef.current * (1 - alpha) + inst * alpha
            : inst;
        } catch (e: any) {
          setErr(String(e));
        } finally {
          busyRef.current = false;
          // Aim ~8–12 fps; adjust delay as needed
          timer = window.setTimeout(tick, 30);
        }
      }, "image/jpeg", 0.5);
    };

    tick();
    return () => { if (timer) window.clearTimeout(timer); };
  }, [running]); // <-- no 'busy' here to avoid effect churn

  return (
    <div className="flex flex-row">
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Live Camera (frontend overlay)</h2>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setRunning((s) => !s)}
          className={`px-3 py-2 rounded text-white ${running ? "bg-red-600" : "bg-green-600"}`}
        >
          {running ? "Stop" : "Start"}
        </button>

        <span className="text-sm text-gray-700">
          FPS: {fpsDisplay.inst.toFixed(1)}{" "}
          <span className="text-gray-400">(avg {fpsDisplay.avg.toFixed(1)})</span>
        </span>

        {busyRef.current && <span className="text-sm text-gray-500">processing…</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      <div className="relative inline-block">
        <video
          ref={videoRef}
          className="w-[640px] h-auto rounded border"
          autoPlay
          muted
          playsInline
        />
        <canvas ref={overlayRef} className="absolute left-0 top-0 pointer-events-none" />
      </div>

      {/* hidden capture canvas */}
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
