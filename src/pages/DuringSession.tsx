// src/pages/DuringSession.tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { DuringHeader } from "@/components/session/DuringHeader";
import { LiveRecognition } from "@/components/session/LiveRecognition";
import { UploadImage } from "@/components/session/UploadImage";
import { AttendancePanel } from "@/components/session/AttendancePanel";
import { AttendanceProvider } from "@/components/session/AttendanceProvider";

export default function DuringSession() {
  const { id: sessionId } = useParams();
  const [mode, setMode] = useState<null | "live" | "upload">(null);
  if (!sessionId) return null;

  return (
    <AttendanceProvider sessionId={sessionId}>
      <div className="flex flex-col gap-4 bg-slate-950 text-white min-h-screen">
        <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm mx-8 mt-6">
          <DuringHeader onPickLive={() => setMode("live")} onPickUpload={() => setMode("upload")} />
            
        </Card>

        <div className="mx-8">
          {mode === "live" && <LiveRecognition onDone={() => setMode(null)} />}
          {mode === "upload" && <UploadImage onDone={() => setMode(null)} />}
        </div>

        <div className="mx-8 mb-10">
          <AttendancePanel />
        </div>
      </div>
    </AttendanceProvider>
  );
}
