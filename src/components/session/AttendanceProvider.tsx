// src/pages/during-session/AttendanceProvider.tsx
import * as React from "react";
import  { useAttendanceData }  from "./hooks/useAttendanceData";

const AttendanceCtx = React.createContext<ReturnType<typeof useAttendanceData> | null>(null);

export function AttendanceProvider({ sessionId, children }: { sessionId: string; children: React.ReactNode }) {
  const store = useAttendanceData(sessionId);
  return <AttendanceCtx.Provider value={store}>{children}</AttendanceCtx.Provider>;
}

export function useAttendance() {
  const ctx = React.useContext(AttendanceCtx);
  if (!ctx) throw new Error("useAttendance must be used inside <AttendanceProvider>");
  return ctx;
}
