import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { stringFormatter, formatDate } from "@/components/utils/stringFormatter";
import { useAttendance } from "./AttendanceProvider";
import { Users, XCircle, FileText, Clock, CircleDotDashed } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type RecordRow = {
  attendanceId: string;
  sessionId: string;
  studentId: string;
  student?: { name?: string };
  timestamp?: string | number | Date;
  confidenceThreshold?: number;
  method?: string;
  status?: "present" | "absent" | "late" | "medical" | "pending" | string;
  optionalNotes?: string;
};

export function AttendancePanel() {
  const { sessionMeta, stats, records, loading, actions } = useAttendance();

  // which rows are being edited
  const [editing, setEditing] = React.useState<Record<string, boolean>>({});
  // per-row local drafts (only fields we actually edit)
  const [drafts, setDrafts] = React.useState<
    Record<string, { status?: RecordRow["status"]; optionalNotes?: string }>
  >({});

  const toggleEdit = (row: RecordRow) => {
    setEditing((prev) => {
      const next = !prev[row.attendanceId];
      if (next) {
        // seed draft when entering edit mode
        setDrafts((d) => ({
          ...d,
          [row.attendanceId]: {
            status: (row.status as any) ?? "pending",
            optionalNotes: row.optionalNotes ?? "",
          },
        }));
      }
      return { ...prev, [row.attendanceId]: next };
    });
  };

  const updateDraft = (
    id: string,
    patch: { status?: RecordRow["status"]; optionalNotes?: string }
  ) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));

  const saveRow = async (row: RecordRow) => {
    const draft = drafts[row.attendanceId] ?? {};
    // Send a MINIMAL PATCH so we don't touch confidence or any other field on the server.
    await actions.saveRecord({
      attendanceId: row.attendanceId,
      status: (draft.status ?? row.status ?? "pending") as any,
      optionalNotes: draft.optionalNotes ?? row.optionalNotes ?? "",
    } as any);
    setEditing((e) => ({ ...e, [row.attendanceId]: false }));
  };

  const statCards = [
    { label: "Present", count: stats.present, icon: Users, color: "bg-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { label: "Late", count: stats.late, icon: Clock, color: "bg-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
    { label: "Absent", count: stats.absent, icon: XCircle, color: "bg-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
    { label: "MC", count: stats.medical, icon: FileText, color: "bg-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { label: "Pending", count: stats.pending, icon: CircleDotDashed, color: "bg-slate-500", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" },
  ];

  const statusBadgeClasses = (status?: string) => {
    switch ((status ?? "pending").toLowerCase()) {
      case "present":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "late":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "absent":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "medical":
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      case "pending":
      default:
        return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Current Session Date: {sessionMeta?.date ? formatDate(sessionMeta.date) : "-"}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {sessionMeta?.course && (
            <span>
              Course Name: {sessionMeta.course.courseName} {sessionMeta.course.courseCode}
            </span>
          )}
        </CardDescription>
        <CardDescription className="text-gray-300">
          {sessionMeta?.status && (
            <>
              <span>Current Status: </span>
              <span className="font-bold">{stringFormatter(sessionMeta.status)}</span>
            </>
          )}
        </CardDescription>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2 mt-3">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`${s.bgColor} ${s.borderColor} border rounded-2xl p-5 transition-all hover:scale-105`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`${s.color} p-2 rounded-2xl`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold">{s.count}</span>
                </div>
                <span className="text-gray-300 text-sm font-medium">{s.label}</span>
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
                <TableHead className="pl-6">Student ID</TableHead>
                <TableHead className="pl-6">Student Name</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                    No attendance records yet.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r: RecordRow) => {
                  const isEditing = !!editing[r.attendanceId];
                  const draft = drafts[r.attendanceId] ?? {};
                  const statusValue = (isEditing ? draft.status : r.status) ?? "pending";
                  const notesValue = (isEditing ? draft.optionalNotes : r.optionalNotes) ?? "";

                  return (
                    <TableRow key={r.attendanceId} className="hover:bg-slate-800/40">
                      <TableCell className="pl-6">{r.studentId}</TableCell>
                      <TableCell className="pl-6">{r?.student?.name ?? "-"}</TableCell>
                      <TableCell>{r?.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</TableCell>
                      <TableCell>{`${Number(r.confidenceThreshold ?? 100).toFixed(1)}%`}</TableCell>

                      {/* Method as shadcn Badge */}
                      <TableCell>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {r.method ?? "-"}
                        </Badge>
                      </TableCell>

                      {/* Status (shadcn Select while editing) */}
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={String(statusValue).toLowerCase()}
                            onValueChange={(v) => updateDraft(r.attendanceId, { status: v as RecordRow["status"] })}
                          >
                            <SelectTrigger className="h-8 w-[160px] bg-slate-800/50 border-slate-700/50 text-slate-200 rounded-2xl">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="medical">MC</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`capitalize rounded-full px-3 py-1 border font-medium ${statusBadgeClasses(
                              r.status
                            )}`}
                          >
                            {r.status ?? "pending"}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Remarks */}
                      <TableCell className="max-w-[280px]">
                        {isEditing ? (
                          <Input
                            value={notesValue}
                            onChange={(e) => updateDraft(r.attendanceId, { optionalNotes: e.target.value })}
                            className="h-8 bg-slate-800/50 border-slate-700/50 rounded-2xl text-slate-200"
                          />
                        ) : (
                          r.optionalNotes || "-"
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        {isEditing ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => saveRow(r)}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleEdit(r)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => toggleEdit(r)}>
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
