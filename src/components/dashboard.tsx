// src/components/Live.tsx
"use client"

import { Play, Square, Edit3, Upload, Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { LiveProps } from "../components/utils/dashboard-types"
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAttendanceRecordForSession } from "./api/backend-methods/AttendanceRecord";
import { stringFormatter } from "./utils/stringFormatter";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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



  return (
    <div
      className={cn(
        "relative size-full overflow-hidden",
        // radial gray background (slate → slate)
        "bg-[radial-gradient(ellipse_at_bottom,theme(colors.slate.900)_0%,theme(colors.slate.950)_100%)]",
        // provide spacing so the gradient is visible around cards
        "p-4 md:p-6 lg:p-8"
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

        {/* Records */}
        <Card className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attendance Records</CardTitle>
            <CardDescription>All attendance records for current and past sessions</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Marking Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {localRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No attendance records yet. Start a session to begin tracking attendance.
                    </TableCell>
                  </TableRow>
                ) : (
                  localRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        {record.sessionId?.split?.("_")?.[1] ?? record.sessionId}…
                      </TableCell>
                      <TableCell className="font-medium">{record.studentId}</TableCell>
                      <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              record.confidence >= 90
                                ? "bg-emerald-500"
                                : record.confidence >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            )}
                          />
                          {record.confidence.toFixed(1)}%
                        </div>
                      </TableCell>

                      <TableCell>
                        {editingRecord === record.id ? (
                          <Select
                            value={record.markingType}
                            onValueChange={(v) => updateLocalRecord(record.id, "markingType", v)}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="automatic">Automatic</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              record.markingType === "automatic"
                                ? "border-blue-400 text-blue-400"
                                : "border-purple-400 text-purple-400"
                            )}
                          >
                            {record.markingType}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingRecord === record.id ? (
                          <Select
                            value={record.status}
                            onValueChange={(v) => updateLocalRecord(record.id, "status", v)}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "capitalize",
                              record.status === "present"
                                ? "bg-emerald-100/30 text-emerald-400"
                                : record.status === "late"
                                ? "bg-yellow-100/30 text-yellow-400"
                                : "bg-red-100/30 text-red-400"
                            )}
                          >
                            {record.status}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        {editingRecord === record.id ? (
                          <Input
                            value={record.remarks}
                            onChange={(e) => updateLocalRecord(record.id, "remarks", e.target.value)}
                            placeholder="Add remarks..."
                            className="h-8"
                          />
                        ) : (
                          record.remarks || "-"
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => setEditingRecord(editingRecord === record.id ? null : record.id)}
                        >
                          {editingRecord === record.id ? "Save" : "Edit"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
