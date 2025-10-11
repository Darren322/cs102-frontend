// src/components/Live.tsx
"use client"

import { Play, Square, Edit3, Upload, Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { LiveProps } from "../components/utils/dashboard-types"
import { useParams } from "react-router-dom";
import { getAttendanceRecordForSession, updateSingle } from "./api/backend-methods/AttendanceRecord";
import { formatDate, stringFormatter } from "./utils/stringFormatter";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentSession } from "./api/backend-methods/Sessions";



export function Live({
  sessionActive,
  currentSessionId,
  recognitionMode,
  running,
  err,
  presentList,
  attendanceRecords,
  editingRecord,
  videoRef,
  serverImgRef,
  captureRef,
  fileInputRef,
  WIDTH,
  HEIGHT,
  setRunning,
  stopSession,
  handleFileUpload,
  handleManualEntry, // (kept if you wire it externally)
  updateRecord,
  setEditingRecord,

  // NEW: incoming FPS values
  fps,
  recvFps,
}: LiveProps) {
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualStudentId, setManualStudentId] = useState("")
  const [manualRemarks, setManualRemarks] = useState("")
  const [localRecords, setLocalRecords] = useState(attendanceRecords)
  const [isCurrentSessionClosed, setCurrentClose] = useState(false)
  const updateLocalRecord = (id: string, field: string, value: any) => {
    setLocalRecords(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleLocalAdd = () => {
    if (!manualStudentId.trim()) return

    const newRecord = {
      id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: currentSessionId,
      studentId: manualStudentId,
      timestamp: Date.now(),
      confidence: 100,
      markingType: "manual",
      status: "present",
      remarks: manualRemarks,
    }

    // Prevent duplicates
    if (localRecords.some(r => r.studentId === manualStudentId && r.sessionId === currentSessionId)) {
      alert("Student already marked present!")
      return
    }

    setLocalRecords(prev => [newRecord, ...prev])
    setManualStudentId("")
    setManualRemarks("")
    setShowManualEntry(false)
  }

  useEffect(() => {
    // Only run this when session goes from active → inactive
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
      }

      setLocalRecords(prev => [autoRecord, ...prev])
    }
  }, [running])
  const p = useParams().id;
  const [currentAttendanceRecords, setCurrentAttendanceRecords] = useState<any>([]);
  useEffect(() => {
    getAttendanceRecordForSession(p).then((res) => {
      setCurrentAttendanceRecords(res.data);
      console.log('Success')
    }).catch((error) => {
      console.error(error);
    })
  }, [p])
  const [currentSessionDet, setCurrentSessionDet] = useState<any>([])
  useEffect(() => {
    getCurrentSession(p).then((response) => {
      setCurrentSessionDet(response.data)
      setCurrentClose(response.data.closed)
    }).catch((err) => {
      console.error(err)
    })
  }, [p])


  console.log(currentSessionDet)
  const [editingRows, setEditingRows] = useState<{ [id: string]: boolean }>({});


  const toggleEditRow = (id: string) => {
    setEditingRows(prev => ({
      ...prev,
      [id]: !prev[id], // toggle only that row
    }));
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
      updateSingle(sessionId, studentId).then((response) => {
        setEditingRows((prev) => ({
          ...prev,
          [recordToUpdate.attendanceId]: false,
        }));
        console.log(response)
      }).catch((error) => {
        console.error(error)
      })

    } catch (error) {
      console.error("❌ Failed to update record:", error);
    }
  };
  return (
    <div
      className={cn(
        "relative w-full overflow-y-auto min-h-screen flex flex-col justify-start",
        // radial gray background (slate → slate)
        "bg-[radial-gradient(ellipse_at_bottom,theme(colors.slate.900)_0%,theme(colors.slate.950)_100%)]",
        // provide spacing so the gradient is visible around cards
        "p-4 md:p-6 lg:p-8",
        "flex flex-col justify-start min-h-screen"

      )}
    >
      <div className="space-y-6">

        {sessionActive && (
          <Card className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Active Session</CardTitle>
                  <CardDescription className="space-y-0.5">
                    <p>Session ID: <span className="font-medium text-foreground">{currentSessionId}</span></p>
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
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${running
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                    >
                      {running ? <Square size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                      {running ? "Stop Recognition" : "Start Recognition"}
                    </button>
                  )}

                  <Button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Edit3 size={18} />
                    Manual Entry
                  </Button>

                  <Button onClick={stopSession} variant="outline">
                    End Session
                  </Button>
                </div>
              </div>

              {err && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Live / Upload panel */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    {recognitionMode === "live" ? (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          width={WIDTH}
                          height={HEIGHT}
                          autoPlay
                          muted
                          playsInline
                          className={cn(
                            "rounded-md border border-border",
                            running ? "hidden" : "block"
                          )}
                        />
                        <img
                          ref={serverImgRef}
                          width={WIDTH}
                          height={HEIGHT}
                          className={cn(
                            "rounded-md border border-border",
                            running ? "block" : "hidden"
                          )}
                          alt="Recognition feed"
                        />
                        <canvas ref={captureRef} className="hidden" />
                      </div>
                    ) : (
                      <div className="rounded-md border-2 border-dashed border-border/60 p-8 text-center">
                        <Upload size={48} className="mx-auto mb-4 opacity-70" />
                        <p className="text-muted-foreground mb-4">
                          Upload an image for face recognition
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Choose Image
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right: Present list */}
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Currently Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md bg-muted p-4 max-h-80 overflow-y-auto">
                      {presentList.length === 0 ? (
                        <p className="text-muted-foreground text-center">
                          No students detected yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {presentList.map((student) => (
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

              {showManualEntry && (
                <Card className="border-border/70 bg-yellow-50/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Manual Attendance Entry</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Student ID"
                      value={manualStudentId}
                      onChange={(e) => setManualStudentId(e.target.value)}
                    />
                    <Input
                      placeholder="Remarks (optional)"
                      value={manualRemarks}
                      onChange={(e) => setManualRemarks(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleLocalAdd} className="gap-1">
                        <Check size={18} />
                        Add
                      </Button>
                      <Button
                        onClick={() => setShowManualEntry(false)}
                        variant="outline"
                        className="gap-1"
                      >
                        <X size={18} />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}
        <Card className="mt-2 border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 rounded-2xl w-full -mx-3 sm:-mx-6 lg:-mx-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Session Date: {formatDate(currentSessionDet.date)}</CardTitle>

            <CardDescription className="text-gray-300">
              {currentSessionDet && currentSessionDet.course && (
                <span>Course Name: {currentSessionDet.course.courseName}</span>
              )}
            </CardDescription>

            <CardDescription className="text-gray-300">
              {currentSessionDet && currentSessionDet.course && (
                <span>Course Code: {currentSessionDet.course.courseCode}</span>
              )}
            </CardDescription>



          </CardHeader>

          <CardContent className="px-5">
            <div className="overflow-x-auto rounded-2xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm shadow-inner">
              <Table className="min-w-[1200px] w-full table-auto rounded-2xl overflow-hidden">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800/60 to-slate-900/50 border-b border-slate-800/50">
                    <TableHead className="text-slate-300 font-medium">Student ID</TableHead>
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
                        className={cn(
                          "transition-all duration-200 ease-in-out",
                          "hover:bg-slate-800/40 hover:shadow-md hover:shadow-slate-900/30"
                        )}
                      >
                        <TableCell className="font-medium text-slate-300">{record.studentId}</TableCell>

                        <TableCell className="text-slate-400">
                          {new Date(record.timestamp).toLocaleString()}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                record.confidenceThreshold >= 0.9
                                  ? "bg-emerald-400"
                                  : record.confidenceThreshold >= 0.7
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
                          {editingRows[record.attendanceId] ? (
                            <Select
                              value={record.method?.toLowerCase() ?? ""}
                              onValueChange={(v) =>
                                setCurrentAttendanceRecords((prev) =>
                                  prev.map((r) =>
                                    r.attendanceId === record.attendanceId ? { ...r, method: v } : r
                                  )
                                )
                              }
                            >
                              <SelectTrigger className="h-8 w-[140px] bg-slate-800/50 border-slate-700/50 text-slate-200 rounded-lg">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="automatic">Automatic</SelectItem>
                                <SelectItem value="manual">Manual</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize rounded-full px-3 py-1 border",
                                record.markingType === "automatic"
                                  ? "border-blue-500/30 text-blue-400"
                                  : "border-purple-500/30 text-purple-400"
                              )}
                            >
                              {stringFormatter(record.method)}
                            </Badge>
                          )}
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
                              <SelectTrigger className="h-8 w-[140px] bg-slate-800/50 border-slate-700/50 text-slate-200 rounded-lg">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "capitalize rounded-full px-3 py-1 border font-medium",
                                record.status === "present"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : record.status === "late"
                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
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
                              className="h-8 bg-slate-800/50 border-slate-700/50 rounded-lg text-slate-200"
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
  )
}
