import { useEffect, useRef, useState } from "react";

// Types for events
type PresentEvent = {
  type: "present" | "left";
  studentId?: string;
  name?: string;
  conf?: number;
  at?: number;
};

type DetsMsg = {
  type: "dets";
  seq: number;
  dets: Array<{ name?: string; confidence?: number }>;
};

export default function LiveCamServerDrawnWithTable() {
  // Refs for media + transport
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const serverImgRef = useRef<HTMLImageElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const busyRef = useRef(false);
  const lastUrlRef = useRef<string | null>(null);
  const seqRef = useRef(1);

  // UI state
  const [running, setRunning] = useState(false);  // Video stream running state
  const [err, setErr] = useState<string>("");

  // Attendance state
  const [presentList, setPresentList] = useState<Array<{ name: string; since: number }>>([]);

  // Config
  const WIDTH = 640;
  const HEIGHT = 480;
  const WS_URL = "wss://api.attendanceapi.xyz/ws/live-scan"; // <- your endpoint

  // -------- Camera setup (capture only) --------
  useEffect(() => {
    (async () => {
      try {
        // Access the user's webcam and set it as the source for the video element
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: WIDTH, height: HEIGHT, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();  // Start playing the webcam feed
        }
      } catch (e: any) {
        setErr(String(e));  // If an error occurs (e.g., permission denied), set the error message
      }
    })();
    return () => {
      // Clean up webcam tracks when component unmounts
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());  // Stop all media tracks
    };
  }, []);

  // -------- WebSocket (to receive frames and events from the server) --------
  useEffect(() => {
    if (!running) {
      // Close WebSocket if not running
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    // Open a WebSocket connection to the server
    const ws = new WebSocket(WS_URL);
    ws.binaryType = "blob";  // Set the binary data type to handle JPEG images
    wsRef.current = ws;

    // WebSocket event handlers
    ws.onopen = () => setErr("");  // Clear error when connection opens
    ws.onerror = () => setErr("WebSocket error");  // Handle WebSocket errors
    ws.onclose = () => {};  // No specific action on WebSocket close

    ws.onmessage = (ev) => {
      // Check if message is a JPEG binary frame
      if (typeof ev.data !== "string") {
        const url = URL.createObjectURL(ev.data as Blob);  // Convert binary to URL for displaying
        const imgEl = serverImgRef.current;
        if (imgEl) {
          // Revoke old image URL to free up memory
          if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
          imgEl.src = url;  // Set new image URL
          lastUrlRef.current = url;  // Store the URL for future cleanup
        }
        return;
      }

      // If the message is JSON (attendance or detections event)
      try {
        const msg = JSON.parse(ev.data) as PresentEvent | DetsMsg | any;

        // Handle attendance events
        if (msg.type === "present" || msg.type === "left") {
          const name = (msg as PresentEvent).name || (msg as any).studentId || "Unknown";
          if (msg.type === "present") {
            setPresentList((prev) => {
              if (prev.some((p) => p.name === name)) return prev;  // Avoid adding duplicates
              return [...prev, { name, since: Date.now() }];
            });
          } else {
            setPresentList((prev) => prev.filter((p) => p.name !== name));  // Remove "left" students from table
          }
          return;
        }

        // Handle detection events (add recognized names to the table)
        if (msg.type === "dets" && Array.isArray(msg.dets)) {
          const names = (msg as DetsMsg).dets
            .map((d) => d.name)
            .filter((n): n is string => !!n && n !== "Unknown");
          if (names.length) {
            setPresentList((prev) => {
              const set = new Set(prev.map((p) => p.name));
              const now = Date.now();
              for (const n of names) if (!set.has(n)) prev = [...prev, { name: n, since: now }];
              return prev.slice();
            });
          }
        }
      } catch {
        // If JSON parsing fails, do nothing (invalid data)
      }
    };

    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);  // Clean up image URLs
        lastUrlRef.current = null;
      }
      ws.close();  // Close WebSocket connection when component unmounts
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [running]);

  // -------- Capture & send frames to backend --------
  useEffect(() => {
    if (!running) return;
    let timer = 0 as unknown as number;

    const tick = () => {
      if (busyRef.current) {
        timer = window.setTimeout(tick, 1);  // Wait if still busy
        return;
      }
      const video = videoRef.current!;
      const cap = captureRef.current!;
      if (!video || !cap || video.readyState < 2) {
        timer = window.setTimeout(tick, 60);  // Retry if video is not ready
        return;
      }

      // Use actual video dimensions (avoid hardcoding)
      const vw = (video as any).videoWidth || WIDTH;
      const vh = (video as any).videoHeight || HEIGHT;

      cap.width = vw;
      cap.height = vh;
      const ctx = cap.getContext("2d")!;
      ctx.drawImage(video, 0, 0, cap.width, cap.height);  // Draw video frame to canvas

      busyRef.current = true;
      cap.toBlob(
        (blob) => {
          busyRef.current = false;

          if (!blob || !blob.size) {
            timer = window.setTimeout(tick, 20);  // Retry if no blob
            return;
          }
          const ws = wsRef.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            timer = window.setTimeout(tick, 50);  // Wait if WebSocket is not ready
            return;
          }
          if (ws.bufferedAmount > 2_000_000) {
            // backpressure: wait if WebSocket buffer is high
            timer = window.setTimeout(tick, 10);
            return;
          }
          try {
            const seq = seqRef.current++;
            ws.send(JSON.stringify({ type: "frame", seq }));  // Send frame header
            ws.send(blob);  // Send the JPEG frame to server
          } catch {
            setErr("Send failed");  // Handle errors in sending
          } finally {
            timer = window.setTimeout(tick, 12);  // ~100 fps loop gate
          }
        },
        "image/jpeg",  // Set the image type
        0.5  // JPEG quality (0–1)
      );
    };

    tick();  // Start frame capture loop
    return () => window.clearTimeout(timer);  // Cleanup on component unmount
  }, [running]);

  // -------- UI --------
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Attendance (server-drawn stream)</h2>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setRunning((s) => !s)}
          className={`px-3 py-2 rounded text-white ${running ? "bg-red-600" : "bg-green-600"}`}
        >
          {running ? "Stop" : "Start"}
        </button>
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      <div className="relative inline-block">
        {/* Show video preview when not running, hide when running */}
        <video
          ref={videoRef}
          width={WIDTH}
          height={HEIGHT}
          autoPlay
          muted
          playsInline
          className={running ? "hidden" : "block"} // Tailwind: hide video when running
        />
        {/* Server-rendered frames (with boxes) shown on canvas */}
        <img
          ref={serverImgRef}
          width={WIDTH}
          height={HEIGHT}
          className={`rounded border ${running ? "block" : "hidden"}`} // Tailwind: show img when running
        />
        <canvas ref={captureRef} className="hidden" />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Present Students</h3>
        <table className="border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-1 text-left">#</th>
              <th className="border border-gray-300 px-3 py-1 text-left">Name / ID</th>
              <th className="border border-gray-300 px-3 py-1 text-left">Since</th>
            </tr>
          </thead>
          <tbody>
            {presentList.length === 0 ? (
              <tr>
                <td className="border border-gray-300 px-3 py-2" colSpan={3}>
                  (none yet)
                </td>
              </tr>
            ) : (
              presentList.map((p, i) => (
                <tr key={p.name}>
                  <td className="border border-gray-300 px-3 py-1">{i + 1}</td>
                  <td className="border border-gray-300 px-3 py-1">{p.name}</td>
                  <td className="border border-gray-300 px-3 py-1">
                    {new Date(p.since).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
