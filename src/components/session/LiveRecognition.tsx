// src/pages/during-session/LiveRecognition.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { useLiveRecognition } from "./hooks/useLiveRecognition";
import { useAttendance } from "./AttendanceProvider";
import { cn } from "@/lib/utils";

export function LiveRecognition({ deviceId, onDone }: { deviceId: string; onDone: () => void }) { // 👈 ADD deviceId prop
  const { sessionMeta } = useAttendance();
  const {
    refs: { videoRef, serverImgRef, captureRef },
    running,
    setRunning,
    stats: { fps, serverFps },
    ui: { serverReady },
  } = useLiveRecognition(deviceId); // 👈 PASS deviceId to hook

  // Only swap UI to the server image when we *know* frames are arriving
  const showServer = running && serverReady;

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Course Live Feed</CardTitle>
            <CardDescription className="space-y-0.5">
              <p>Session: <span className="font-medium">{sessionMeta.sessionID || "-"}</span></p>
              <p className="text-sm">
                FPS: <span className="font-medium">{Math.round(fps)}</span>
                <span className="ml-2">• Server FPS: <span className="font-medium">{Math.round(serverFps)}</span></span>
              </p>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setRunning(!running)}>
              {running ? (<><Square size={18} className="mr-2" /> Stop Recognition</>) : (<><Play size={18} className="mr-2" /> Start Recognition</>)}
            </Button>
            <Button variant="outline" onClick={onDone}>End Recording</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="relative w-full">
          {/* Local preview stays visible until server frames arrive */}
          <video
            ref={videoRef}
            width={640}
            height={480}
            autoPlay
            muted
            playsInline
            className={cn("rounded-md border border-border w-3/4 mx-auto", showServer ? "hidden" : "block")}
          />

          {/* Server-annotated stream shows only when frames are actually received */}
          <img
            ref={serverImgRef}
            width={640}
            height={480}
            className={cn("rounded-md border border-border w-3/4 mx-auto", showServer ? "block" : "hidden")}
            alt="Recognition feed"
          />

          {/* Hidden capture canvas for encoding frames to JPEG */}
          <canvas ref={captureRef} className="hidden" />
        </div>
      </CardContent>
    </Card>
  );
}