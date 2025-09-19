import { useEffect, useRef, useState } from "react";

type Det = { x:number; y:number; w:number; h:number; name:string; confidence:number };
// If you can, have the backend also return the image size it used for detection:
type ScanResponseItem = Det & { imgW?: number; imgH?: number };

export default function App() {
  const [imgURL, setImgURL] = useState<string>("");
  const [dets, setDets] = useState<ScanResponseItem[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [loading, setLoading] = useState(false);
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
  if (!file) return;

  const localURL = URL.createObjectURL(file);
  setImgURL(localURL);

  const form = new FormData();
  form.append("image", file);

  try {
    setLoading(true);
    const res = await fetch("http://112.199.250.89:8081/api/recognition/scan", {
      method: "POST",
      body: form,
    });
    const json = (await res.json()) as ScanResponseItem[];
    setDets(json);
  } finally {
    setLoading(false);
  }
  }

  // Draw overlay whenever image or detections change
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.complete) return;

    // Size the canvas to exactly match the displayed image (CSS px)
    const cssW = img.clientWidth;
    const cssH = img.clientHeight;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    // HiDPI: render at devicePixelRatio for crisp lines
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing -> CSS pixels
    ctx.clearRect(0, 0, cssW, cssH);

    // Figure out coordinate scaling
    // If backend provided imgW/imgH, use them; else assume it used the original image size
    const srcW = dets[0]?.imgW ?? img.naturalWidth;
    const srcH = dets[0]?.imgH ?? img.naturalHeight;

    const scaleX = cssW / srcW;
    const scaleY = cssH / srcH;

    // Draw each detection
    ctx.lineWidth = 2;
    ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    dets.forEach((d) => {
      console.log(d.name);
      console.log(d.confidence);
      if(d.name != "Unknown") {
        const x = d.x * scaleX;
      const y = d.y * scaleY;
      const w = d.w * scaleX;
      const h = d.h * scaleY;

      // box
      ctx.strokeStyle = "#22c55e"; // Tailwind green-500
      ctx.strokeRect(x, y, w, h);

      // label bg
      const label = d.name != "unknown" ? `${d.name} ${(d.confidence).toFixed(0)}%` : "";
      const padX = 6;
      const textW = ctx.measureText(label).width;
      const boxX = x, boxY = Math.max(0, y - 22);
      ctx.fillStyle = "rgba(34,197,94,0.85)";
      ctx.fillRect(boxX, boxY, textW + padX*2, 20);

      // label text
      ctx.fillStyle = "#fff";
      ctx.fillText(label, boxX + padX, boxY + 15);

      }
      
    });
  }, [imgURL, dets]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Face Scanner (Frontend overlay)</h1>

      {/* Pretty upload button */}
      <input id="fileUpload" type="file" onChange={handleUpload} className="hidden" />
      <label htmlFor="fileUpload"
             className="inline-block cursor-pointer px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
        Upload Image
      </label>
        {loading && (
  <div className="w-full max-w-xl mt-2 h-2 bg-gray-200 rounded overflow-hidden">
    <div className="h-full bg-blue-600 animate-pulse" style={{ width: "100%" }} />
  </div>
)}
      {/* Image + overlay */}
      {imgURL && (
        <div className="relative inline-block">
          <img
            ref={imgRef}
            src={imgURL}
            alt="uploaded"
            className="max-w-xl h-auto rounded border"
            onLoad={() => {
              // trigger a redraw when the image finishes loading
              setDets((prev) => [...prev]);
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute left-0 top-0 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
