import * as React from "react";
import { toast } from "sonner";
import ImportAttendanceButton from "@/components/ui/import-csv-button";

import { getCurrentSession, activateCourse, closeCourse } from "@/components/api/backend-methods/Sessions";
import {
  getAttendanceRecordForSession,
  getTotalPresent,
  getTotalLate,
  getTotalPending,
  getTotalMedical,
  getTotalAbsent,
  updateSingle,
  batchMark,
  automaticMark,
} from "@/components/api/backend-methods/AttendanceRecord";
import { csvExport, pdfExport } from "@/components/api/backend-methods/pdf-csv";

import { BatchMarkDialog } from "../parts/BatchMarkDialog";
import { ExportDialog } from "../parts/ExportDialog";

type AutoMarkItem = {
  studentId: string;
  confidence: number;
  timestamp: string; // ISO
  recordedBy: string;
};

export function useAttendanceData(routeSessionId: string) {
  const [sessionMeta, setSessionMeta] = React.useState<any>({ sessionID: "", active: false, closed: false });
  const [records, setRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState({ present: 0, late: 0, pending: 0, medical: 0, absent: 0 });

  const [showBatch, setShowBatch] = React.useState(false);
  const [showExport, setShowExport] = React.useState(false);

  // ---------- data refreshers ----------
  const refreshMeta = React.useCallback(async () => {
    if (!routeSessionId) return;
    const res = await getCurrentSession(routeSessionId);
    setSessionMeta(res.data);
  }, [routeSessionId]);

  const refreshStats = React.useCallback(async () => {
    if (!routeSessionId) return;
    const [a, b, c, d, e] = await Promise.all([
      getTotalPresent(routeSessionId),
      getTotalLate(routeSessionId),
      getTotalPending(routeSessionId),
      getTotalMedical(routeSessionId),
      getTotalAbsent(routeSessionId),
    ]);
    setStats({
      present: a.data ?? 0,
      late: b.data ?? 0,
      pending: c.data ?? 0,
      medical: d.data ?? 0,
      absent: e.data ?? 0,
    });
  }, [routeSessionId]);

  const refreshRecords = React.useCallback(async () => {
    if (!routeSessionId) return;
    setLoading(true);
    try {
      const res = await getAttendanceRecordForSession(routeSessionId);
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  }, [routeSessionId]);

  React.useEffect(() => { refreshMeta(); }, [refreshMeta]);
  React.useEffect(() => { refreshStats(); }, [refreshStats]);
  React.useEffect(() => { refreshRecords(); }, [refreshRecords]);

  // ---------- batched autoMark (flush every 5s) ----------
  const pendingAutoMarksRef = React.useRef<Map<string, AutoMarkItem>>(new Map());
  const flushTimerRef = React.useRef<number | null>(null);

  const flushAutoMark = React.useCallback(async () => {
    const q = pendingAutoMarksRef.current;
    if (!q.size || !sessionMeta.sessionID) return;

    const payload = Array.from(q.values());
    // clear before await to avoid overlap
    pendingAutoMarksRef.current = new Map();

    try {
      await automaticMark(sessionMeta.sessionID, payload);
      toast.success(`Auto-marked ${payload.length} student(s)`);
      await Promise.all([refreshRecords(), refreshStats()]);
    } catch (e: any) {
      // requeue once if it fails so we don't drop detections
      for (const item of payload) q.set(item.studentId, item);
      toast.error(String(e?.message ?? e));
    }
  }, [sessionMeta.sessionID, refreshRecords, refreshStats]);

  React.useEffect(() => {
    if (!sessionMeta.sessionID) return;
    if (flushTimerRef.current != null) return;

    flushTimerRef.current = window.setInterval(() => {
      flushAutoMark();
    }, 5000) as unknown as number;

    return () => {
      if (flushTimerRef.current != null) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [sessionMeta.sessionID, flushAutoMark]);

  // ---------- actions ----------
  const actions = {
    setActive: async () => {
      await activateCourse(routeSessionId);
      toast.success("Set to Active");
      await refreshMeta();
    },
    closeSession: async () => {
      await closeCourse(routeSessionId);
      await refreshMeta();
    },
    exportCSV: async () => { await csvExport(routeSessionId); toast.success("CSV emailed"); },
    exportPDF: async () => { await pdfExport(routeSessionId); toast.success("PDF emailed"); },
    openBatchDialog: () => setShowBatch(true),

    // queue detections; flush interval posts them
    autoMark: async (items: AutoMarkItem[]) => {
      if (!items?.length) return;
      const q = pendingAutoMarksRef.current;
      for (const it of items) {
        const id = (it.studentId ?? "").toString();
        if (!id) continue;
        const prev = q.get(id);
        if (!prev) {
          q.set(id, it);
        } else {
          // keep latest timestamp AND highest confidence
          const newer = new Date(it.timestamp).getTime() >= new Date(prev.timestamp).getTime();
          q.set(id, {
            studentId: id,
            confidence: Math.max(prev.confidence ?? 0, it.confidence ?? 0),
            timestamp: newer ? it.timestamp : prev.timestamp,
            recordedBy: it.recordedBy ?? prev.recordedBy,
          });
        }
      }
    },

    // Save a single row: find sessionId & studentId from records by attendanceId.
    // Only send status/notes/recordedBy — do NOT mutate confidence or method.
    saveRecord: async (patch: { attendanceId: string; status?: string; optionalNotes?: string }) => {
      const row = records.find((r) => r.attendanceId === patch.attendanceId);
      if (!row) {
        toast.error("Record not found");
        return;
      }
      const sessionId = row.sessionId;
      const studentId = row.studentId;

      if (!sessionId || !studentId) {
        toast.error("Missing IDs to update record");
        return;
      }

      await updateSingle(sessionId, studentId, {
        status: (patch.status ?? row.status ?? "pending").toString().toUpperCase(),
        optionalNotes: patch.optionalNotes ?? row.optionalNotes ?? "",
        recordedBy: localStorage.getItem("username") || "unknown",
      });

      // re-fetch to stay in sync (confidence etc. preserved)
      await Promise.all([refreshRecords(), refreshStats()]);
    },
  } as const;

  const dialogs = (
    <>
      <BatchMarkDialog
        open={showBatch}
        onOpenChange={setShowBatch}
        onConfirm={async (status, notes) => {
          await batchMark({ status, optionalNotes: notes, recordedBy: localStorage["username"] }, routeSessionId);
          toast.success("Batch updated");
          setShowBatch(false);
          await Promise.all([refreshRecords(), refreshStats()]);
        }}
      />
      <ExportDialog open={showExport} onOpenChange={setShowExport} onCSV={actions.exportCSV} onPDF={actions.exportPDF} />
    </>
  );
  console.log(showBatch);

  const components = { ImportCSVButton: ImportAttendanceButton } as const;

  return { sessionMeta, records, loading, stats, actions, dialogs, components } as const;
}
