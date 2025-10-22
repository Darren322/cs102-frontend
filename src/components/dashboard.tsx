"use client";

import { Play, Square, Upload, Users, XCircle, FileText, Clock, CircleDotDashed } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  getAttendanceRecordForSession,
  getTotalAbsent,
  getTotalLate,
  getTotalMedical,
  getTotalPending,
  getTotalPresent,
  updateSingle
} from "./api/backend-methods/AttendanceRecord";
import { getCurrentSession } from "./api/backend-methods/Sessions";
import { formatDate, stringFormatter } from "./utils/stringFormatter";

// NOTE: We accept a flexible props object to avoid type mismatches with parent.
// If you have a shared LiveProps type, you can swap it in here (make err optional).
type Props = {
  sessionActive: boolean;
  currentSessionId: string;
  recognitionMode: "live" | "upload" | null;
  running: boolean;
  isSubmitted: boolean;
  presentList: Array<{ name: string; since: number }>;
  attendanceRecords: any[];
  videoRef: React.RefObject<HTMLVideoElement>;
  serverImgRef: React.RefObject<HTMLImageElement>;
  captureRef: React.RefObject<HTMLCanvasElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadCanvasRef: React.RefObject<HTMLCanvasElement>; // <-- added
  WIDTH: number;
  HEIGHT: number;
  setRunning: (v: boolean) => void;
  stopSession: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // optional/extra props coming from parent – ignored safely if not provided
  setActiveTab?: (v: string) => void;
  setShowManualEntry?: (v: boolean) => void;
  handleManualEntry?: () => void;
  updateRecord?: (id: string, field: string, value: any) => void;
  setEditingRecord?: (id: string | null) => void;
  editingRecord?: string | null;
  showManualEntry?: boolean;
  manualStudentId?: string;
  manualRemarks?: string;
  // fps
  fps?: number;
  recvFps?: number;
  // err is removed; if you still want it, make it optional
  err?: string;
};

export function Live({
  sessionActive,
  currentSessionId,
  recognitionMode,
  running,
  isSubmitted,
  err,
  presentList,
  attendanceRecords,
  videoRef,
  serverImgRef,
  captureRef,
  fileInputRef,
  uploadCanvasRef,   // <-- receive from parent
  WIDTH,
  HEIGHT,
  setRunning,
  stopSession,
  handleFileUpload, // <-- parent handles drawing + marking
  fps,
  recvFps,
}: Props) {
  const [localRecords, setLocalRecords] = useState(attendanceRecords);
  const [isCurrentSessionClosed, setCurrentClose] = useState(false);

  const safePresentList = useMemo(
    () =>
      (presentList ?? []).filter(
        (p): p is { name: string; since: number } =>
          !!p && typeof (p as any).name === "string" && (p as any).name.length > 0
      ),
    [presentList]
  );

  useEffect(() => {
    if (!running && sessionActive && currentSessionId) {
      const autoRecord = {
        id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sessionId: currentSessionId,
        studentId: "STUDENT_AUTO_01",
        timestamp: Date.now(),
        confidence: 95,
        markingType: "automatic",
        status: "present",
        remarks: "Auto-marked when recognition stopped",
      };
      setLocalRecords((prev) => [autoRecord, ...prev]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const p = useParams().id;
  const [currentAttendanceRecords, setCurrentAttendanceRecords] = useState<any[]>([]);
  const [currentSessionDet, setCurrentSessionDet] = useState<any>({}); // guard against undefined.course

  useEffect(() => {
    if (!p) return;
    getAttendanceRecordForSession(p)
      .then((res) => {
        console.log(res.data);
        setCurrentAttendanceRecords(res.data)
      })
      .catch(console.error);
  }, [p, isSubmitted]);

  useEffect(() => {
    if (!p) return;
    getCurrentSession(p)
      .then((response) => {
        setCurrentSessionDet(response.data);
        setCurrentClose(response.data.closed);
      })
      .catch(console.error);
  }, [p]);

  // Totals — moved into an effect so they don’t refetch every render
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalLate, setTotalLate] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalMedical, setTotalMedical] = useState(0);
  const [totalAbsent, setTotalAbsent] = useState(0);

  useEffect(() => {
    if (!p) return;
    let alive = true;
    (async () => {
      try {
        const [pres, late, pend, med, abs] = await Promise.all([
          getTotalPresent(p),
          getTotalLate(p),
          getTotalPending(p),
          getTotalMedical(p),
          getTotalAbsent(p),
        ]);
        if (!alive) return;
        setTotalPresent(pres.data ?? 0);
        setTotalLate(late.data ?? 0);
        setTotalPending(pend.data ?? 0);
        setTotalMedical(med.data ?? 0);
        setTotalAbsent(abs.data ?? 0);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [p, isSubmitted]);

  const [editingRows, setEditingRows] = useState<{ [id: string]: boolean }>({});
  const toggleEditRow = (id: string) => {
    setEditingRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSingleUpdate = async (sessionId: string, studentId: string) => {
    try {
      const recordToUpdate = currentAttendanceRecords.find(
        (r: any) => r.sessionId === sessionId && r.studentId === studentId
      );
      if (!recordToUpdate) {
        console.error("Record not found for update");
        return;
      }
      const payload = {
        status: recordToUpdate.status?.toUpperCase() || "PENDING",
        method: recordToUpdate.method?.toUpperCase() || "MANUAL",
        optionalNotes: recordToUpdate.optionalNotes || "",
        recordedBy: localStorage.getItem("username") || "unknown",
      };
      await updateSingle(sessionId, studentId, payload);
      setEditingRows((prev) => ({ ...prev, [recordToUpdate.attendanceId]: false }));
      const newDate = new Date().toISOString();
      setCurrentAttendanceRecords((prev: any) =>
        prev.map((r: any) =>
          r.attendanceId === recordToUpdate.attendanceId ? { ...r, ...payload, timestamp: newDate } : r
        )
      );
    } catch (error) {
      console.error("❌ Failed to update record:", error);
    }
  };

  const statCards = [
    { label: "Present", count: totalPresent, icon: Users, color: "bg-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { label: "Late", count: totalLate, icon: Clock, color: "bg-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
    { label: "Absent", count: totalAbsent, icon: XCircle, color: "bg-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
    { label: "MC", count: totalMedical, icon: FileText, color: "bg-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { label: "Pending", count: totalPending, icon: CircleDotDashed, color: "bg-slate-500", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" },
  ];

  const navigate = useNavigate();


  return (
    <div
      className={cn(
        "relative w-full overflow-y-auto n flex flex-col justify-start",
        "bg-[radial-gradient(ellipse_at_bottom,theme(colors.slate.900)_0%,theme(colors.slate.950)_100%)]",
        "",
        "flex flex-col justify-start"
      )}
    >
      <div className="space-y-6">
        {sessionActive && (
          <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm mx-8 mt-6">
            <CardHeader className="pb-3 pt-4 px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    {/* guard currentSessionDet.course */}
                    Course Name:{" "}
                    {(currentSessionDet?.course?.courseName ?? "-")} {(currentSessionDet?.course?.courseCode ?? "")}
                  </CardTitle>
                  <CardDescription className="space-y-0.5">
                    <p>
                      Session Date:{" "}
                      <span className="font-medium text-foreground">
                        {currentSessionDet?.date ? formatDate(currentSessionDet.date) : "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      Mode: <span className="font-medium">{recognitionMode?.toUpperCase()}</span>
                    </p>
                    {recognitionMode === "live" && (
                      <p className="text-sm">
                        FPS: <span className="font-medium">{Math.round(fps ?? 0)}</span>
                        {typeof recvFps === "number" && (
                          <span className="ml-2">
                            • Server FPS: <span className="font-medium">{Math.round(recvFps)}</span>
                          </span>
                        )}
                      </p>
                    )}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  {recognitionMode === "live" && (
                    <button
                      onClick={() => setRunning(!running)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                        running ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {running ? <Square size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                      {running ? "Stop Recognition" : "Start Recognition"}
                    </button>
                  )}

                  <Button
                    onClick={() => {
                      stopSession();
                      navigate(`/session_start/${p}`);
                    }}
                    variant="outline"
                  >
                    End Recording
                  </Button>
                </div>
              </div>

              {/* err is optional and generally unused now */}
              {err && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6 w-full">
                <Card className="bg-muted/30 flex-1 lg:basis-[70%] rounded-2xl">
                  <CardContent className="p-4">
                    {recognitionMode === "live" ? (
                      <div className="relative w-full">
                        <video
                          ref={videoRef}
                          width={WIDTH}
                          height={HEIGHT}
                          autoPlay
                          muted
                          playsInline
                          className={cn("rounded-md border border-border w-full", running ? "hidden" : "block")}
                        />
                        {/* Image code over here. */}
                        <img
                          ref={serverImgRef}
                          width={WIDTH}
                          height={HEIGHT}
                          className={cn("rounded-md border border-border w-full", running ? "block" : "hidden")}
                          alt="Recognition feed"
                        />
                        <canvas ref={captureRef} className="hidden" />
                      </div>
                    ) : (
                      <div className="rounded-md border-2 border-dashed border-border/60 p-8 text-center">
                        <Upload size={48} className="mx-auto mb-4 opacity-70" />
                        <p className="text-muted-foreground mb-4">Upload an image for face recognition</p>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button onClick={() => fileInputRef.current?.click()}>Choose Image</Button>

                        <div className="mt-6">
                          <canvas
                            ref={uploadCanvasRef}
                            width={WIDTH}
                            height={HEIGHT}
                            className="w-full rounded-md border border-border bg-black/30"
                            aria-label="Uploaded image preview"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right: Present list */}
                <Card className="w-full lg:w-1/3 bg-muted/30 flex-1 lg:basis-[40%] rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Currently Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md bg-muted p-4 max-h-80 overflow-y-auto">
                      {safePresentList.length === 0 ? (
                        <p className="text-muted-foreground text-center">No students detected yet</p>
                      ) : (
                        <div className="space-y-2">
                          {safePresentList.map((student) => (
                            <div
                              key={student.name}
                              className="flex justify-between items-center bg-card p-3 rounded-md border border-border"
                            >
                              <span className="font-medium">{student.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(student.since).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm mx-8 mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Current Session Date: {currentSessionDet?.date ? formatDate(currentSessionDet.date) : "-"}
            </CardTitle>

            <CardDescription className="text-gray-300">
              {currentSessionDet?.course && (
                <span>
                  Course Name: {currentSessionDet.course.courseName} {currentSessionDet.course.courseCode}
                </span>
              )}
            </CardDescription>

            <CardDescription className="text-gray-300">
              {currentSessionDet?.status && (
                <>
                  <span>Current Status: </span>
                  <span className="font-bold">{stringFormatter(currentSessionDet.status)}</span>
                </>
              )}
            </CardDescription>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`${stat.bgColor} ${stat.borderColor} border rounded-2xl p-5 transition-all hover:scale-105`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${stat.color} p-2 rounded-2xl`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold">{stat.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-medium">{stat.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm shadow-inner">
              <Table className="min-w-[1200px] w-full table-auto rounded-2xl overflow-hidden">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800/60 to-slate-900/50 border-b border-slate-800/50">
                    <TableHead className="text-slate-300 font-medium pl-6">Student ID</TableHead>
                    <TableHead className="text-slate-300 font-medium pl-6">Student Name</TableHead>
                    <TableHead className="text-slate-300 font-medium">Timestamp</TableHead>
                    <TableHead className="text-slate-300 font-medium">Confidence</TableHead>
                    <TableHead className="text-slate-300 font-medium">Marking Type</TableHead>
                    <TableHead className="text-slate-300 font-medium">Status</TableHead>
                    <TableHead className="text-slate-300 font-medium">Remarks</TableHead>
                    <TableHead className="text-slate-300 font-medium text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentAttendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                        No attendance records yet. Start a session to begin tracking attendance.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentAttendanceRecords.map((record: any) => (
                      <TableRow
                        key={record.attendanceId}
                        className={cn("transition-all duration-200 ease-in-out", "hover:bg-slate-800/40 hover:shadow-md hover:shadow-slate-900/30")}
                      >
                        <TableCell className="font-medium text-slate-300 pl-6">{record.studentId}</TableCell>
                        <TableCell className="font-medium text-slate-300 pl-6">{record?.student?.name ?? "-"}</TableCell>

                        <TableCell className="text-slate-400">
                          {record?.timestamp ? new Date(record.timestamp).toLocaleString() : "-"}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                (record.confidenceThreshold ?? 100) >= 90
                                  ? "bg-emerald-400"
                                  : (record.confidenceThreshold ?? 100) >= 70
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              )}
                            />
                            <span className="text-slate-300">
                              {(record.confidenceThreshold ?? 100).toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize rounded-full px-3 py-1 border font-medium",
                              record.method?.toUpperCase() === "AUTOMATIC"
                                ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                : record.method?.toUpperCase() === "BATCH_AUTO"
                                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                : record.method?.toUpperCase() === "MANUAL"
                                ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                                : "border-slate-500/30 text-slate-400 bg-slate-500/10"
                            )}
                          >
                            {stringFormatter(record.method)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {editingRows[record.attendanceId] ? (
                            <Select
                              value={record.status?.toLowerCase() ?? ""}
                              onValueChange={(v) =>
                                setCurrentAttendanceRecords((prev) =>
                                  prev.map((r) =>
                                    r.attendanceId === record.attendanceId ? { ...r, status: v } : r
                                  )
                                )
                              }
                            >
                              <SelectTrigger className="h-8 w-[140px] bg-slate-800/50 border-slate-700/50 text-slate-200 rounded-2xl">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="medical">MC</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "capitalize rounded-full px-3 py-1 border font-medium",
                                record.status === "PRESENT"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : record.status === "LATE"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                  : record.status === "ABSENT"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : record.status === "MEDICAL"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                              )}
                            >
                              {stringFormatter(record.status)}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[280px] text-slate-300">
                          {editingRows[record.attendanceId] ? (
                            <Input
                              value={record.optionalNotes ?? ""}
                              onChange={(e) =>
                                setCurrentAttendanceRecords((prev) =>
                                  prev.map((r) =>
                                    r.attendanceId === record.attendanceId
                                      ? { ...r, optionalNotes: e.target.value }
                                      : r
                                  )
                                )
                              }
                              placeholder="Add remarks..."
                              className="h-8 bg-slate-800/50 border-slate-700/50 rounded-2xl text-slate-200"
                            />
                          ) : (
                            record.optionalNotes || "-"
                          )}
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              editingRows[record.attendanceId]
                                ? handleSingleUpdate(record.sessionId, record.studentId)
                                : toggleEditRow(record.attendanceId)
                            }
                            className="rounded-full border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-100 transition-all"
                          >
                            {editingRows[record.attendanceId] ? "Save" : "Edit"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
