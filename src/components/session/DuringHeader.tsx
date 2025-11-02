// src/pages/during-session/DuringHeader.tsx
import * as React from "react";
import { Camera, Upload as UploadIcon, Highlighter, SettingsIcon, File, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { useAttendance } from "./AttendanceProvider";

export function DuringHeader({ onPickLive, onPickUpload }: { onPickLive: () => void; onPickUpload: () => void }) {
  const { sessionMeta, actions, components } = useAttendance();
  console.log(actions);
  console.log(components)
  console.log(sessionMeta)
  const isClosed = sessionMeta.closed;
  const isActive = sessionMeta.active;
  const [closing, setClosing] = React.useState(false);

  const handleClose = async () => {
    try { setClosing(true); await actions.closeSession(); }
    finally { setClosing(false); }
  };

  return (
    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 px-6 py-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Attendance Dashboard</h2>
        <p className="text-gray-300 mt-1">Manage your session, recognition mode, exports and batch actions.</p>
      </div>

      {isClosed ? (
        <div className="grid grid-cols-1 gap-3">
          <components.ImportCSVButton sessionId={sessionMeta.sessionID || ""} />
          <div className="flex gap-2">
            <Button onClick={actions.exportPDF} className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 rounded-2xl">
              <File size={18} className="mr-2" /> PDF
            </Button>
            <Button onClick={actions.exportCSV} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-2xl">
              <FileSpreadsheet size={18} className="mr-2" /> CSV
            </Button>
          </div>
        </div>
      ) : !isActive ? (
        <div className="grid grid-cols-1 gap-3">
          <Button onClick={actions.setActive} className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-400/40 rounded-2xl px-4 py-5">
            <SettingsIcon size={18} className="mr-2" /> Set to Active
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onPickLive} className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-2xl px-4 py-5">
            <Camera size={18} className="mr-2" /> Live Recognition
          </Button>
          <Button onClick={onPickUpload} className="bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-300 rounded-2xl px-4 py-5">
            <UploadIcon size={18} className="mr-2" /> Upload Image
          </Button>
          <Button onClick={actions.openBatchDialog} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-2xl px-4 py-5">
            <Highlighter size={18} className="mr-2" /> Batch Mark
          </Button>
          <Button onClick={handleClose} disabled={closing} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/40 rounded-2xl px-4 py-5">
            {closing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Closing...</>) : "Close Session"}
          </Button>
        </div>
      )}
    </CardHeader>
  );
}
