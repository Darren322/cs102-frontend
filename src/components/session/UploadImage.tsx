// src/pages/during-session/UploadImage.tsx
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { scanPhoto } from "@/components/api/backend-methods/Recognition";
import { useAttendance } from "./AttendanceProvider";

export function UploadImage({ onDone }: { onDone: () => void }) {
  const { sessionMeta, actions } = useAttendance();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const previewRef = React.useRef<HTMLCanvasElement | null>(null);
  const WIDTH = 640, HEIGHT = 480;

  const drawBlobToCanvas = async (blob: Blob) => {
    const bmp = await createImageBitmap(blob);
    try {
      const canvas = previewRef.current!;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      canvas.width = WIDTH; canvas.height = HEIGHT;
      const iw = (bmp as any).width, ih = (bmp as any).height;
      const scale = Math.min(WIDTH / iw, HEIGHT / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (WIDTH - dw) / 2, dy = (HEIGHT - dh) / 2;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(bmp as any, dx, dy, dw, dh);
    } finally { (bmp as any).close?.(); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !file.type.startsWith("image/")) return;
    try {
      await drawBlobToCanvas(file);
      const result = await scanPhoto({ file, sessionId: sessionMeta.sessionID });
      const dets = (result as any).dets ?? result ?? [];
      console.log(dets);
      const payload = (dets as any[])
        .filter((d) => d?.studentId && d?.studentId.toLowerCase() !== "unknown" && d?.confidence >= 70)
        .map((d) => ({
          studentId: d.studentId,
          confidence: d.confidence,
          timestamp: new Date().toISOString(),
          recordedBy: localStorage["username"],
        }));
      if (payload.length) await actions.autoMark(payload);

      const imageJpegBase64: string | undefined = (result as any).imageJpegBase64;
      if (imageJpegBase64) {
        const res = await fetch(imageJpegBase64.startsWith("data:") ? imageJpegBase64 : `data:image/jpeg;base64,${imageJpegBase64}`);
        await drawBlobToCanvas(await res.blob());
      }
      toast.success(`Processed ${payload.length} student(s)`);
    } catch (err: any) {
      toast.error(String(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Upload Image Recognition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border-2 border-dashed border-border/60 p-8 text-center">
          <Upload size={48} className="mx-auto mb-4 opacity-70" />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()}>Choose Image</Button>
          <div className="mt-6">
            <canvas ref={previewRef} width={640} height={480} className="w-full rounded-md border border-border bg-black/30" />
          </div>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onDone}>Done</Button></div>
      </CardContent>
    </Card>
  );
}
