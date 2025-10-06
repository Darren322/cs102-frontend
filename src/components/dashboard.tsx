"use client"

import { Play, Square, Edit3, Upload, Check, X } from "lucide-react"
import type { LiveProps } from "../components/utils/dashboard-types"
import { useEffect, useState } from "react";

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
  handleManualEntry,
  updateRecord,
  setEditingRecord,

  // NEW: incoming FPS values
  fps,
  recvFps,
}: LiveProps) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");
  const [localRecords, setLocalRecords] = useState(attendanceRecords);

  const updateLocalRecord = (id, field, value) => {
    setLocalRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleLocalAdd = () => {
    if (!manualStudentId.trim()) return;

    const newRecord = {
      id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: currentSessionId,
      studentId: manualStudentId,
      timestamp: Date.now(),
      confidence: 100,
      markingType: "manual",
      status: "present",
      remarks: manualRemarks,
    };

    // Prevent duplicates
    if (localRecords.some(r => r.studentId === manualStudentId && r.sessionId === currentSessionId)) {
      alert("Student already marked present!");
      return;
    }

    setLocalRecords(prev => [newRecord, ...prev]);
    setManualStudentId("");
    setManualRemarks("");
    setShowManualEntry(false);
  };

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
      };

      setLocalRecords(prev => [autoRecord, ...prev]);
    }
  }, [running]);

  return (
    <div className="space-y-6">
      {sessionActive && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Active Session</h3>
              <p className="text-gray-600">Session ID: {currentSessionId}</p>
              <p className="text-sm text-gray-500">Mode: {recognitionMode?.toUpperCase()}</p>

              {/* NEW: FPS row */}
              {recognitionMode === "live" && (
                <p className="text-sm text-gray-500 mt-1">
                  FPS: <span className="font-medium">{Math.round(fps ?? 0)}</span>
                  {typeof recvFps === "number" && (
                    <span className="ml-2">
                      • Server FPS: <span className="font-medium">{Math.round(recvFps)}</span>
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {recognitionMode === "live" && (
                <button
                  onClick={() => setRunning(!running)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    running
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {running ? <Square size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                  {running ? "Stop Recognition" : "Start Recognition"}
                </button>
              )}

              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Edit3 size={18} className="mr-2" />
                Manual Entry
              </button>

              <button
                onClick={stopSession}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg mb-4">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {recognitionMode === "live" ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    width={WIDTH}
                    height={HEIGHT}
                    autoPlay
                    muted
                    playsInline
                    className={`rounded-lg border ${running ? "hidden" : "block"}`}
                  />
                  <img
                    ref={serverImgRef}
                    width={WIDTH}
                    height={HEIGHT}
                    className={`rounded-lg border ${running ? "block" : "hidden"}`}
                    alt="Recognition feed"
                  />
                  <canvas ref={captureRef} className="hidden" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Upload an image for face recognition</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose Image
                  </button>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Currently Present</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                {presentList.length === 0 ? (
                  <p className="text-gray-500 text-center">No students detected yet</p>
                ) : (
                  <div className="space-y-2">
                    {presentList.map((student) => (
                      <div
                        key={student.name}
                        className="flex justify-between items-center bg-white p-3 rounded border"
                      >
                        <span className="font-medium">{student.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(student.since).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showManualEntry && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Manual Attendance Entry</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Student ID"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Remarks (optional)"
                  value={manualRemarks}
                  onChange={(e) => setManualRemarks(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleLocalAdd}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check size={18} className="mr-1" />
                    Add
                  </button>
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={18} className="mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
          <p className="text-sm text-gray-600">All attendance records for current and past sessions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marking Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No attendance records yet. Start a session to begin tracking attendance.
                  </td>
                </tr>
              ) : (
                localRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.sessionId.split("_")[1]}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            record.confidence >= 90
                              ? "bg-green-500"
                              : record.confidence >= 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        {record.confidence.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRecord === record.id ? (
                        <select
                          value={record.markingType}
                          onChange={(e) => updateLocalRecord(record.id, "markingType", e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="automatic">Automatic</option>
                          <option value="manual">Manual</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.markingType === "automatic"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {record.markingType}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRecord === record.id ? (
                        <select
                          value={record.status}
                          onChange={(e) => updateLocalRecord(record.id, "status", e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "late"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingRecord === record.id ? (
                        <input
                          type="text"
                          value={record.remarks}
                          onChange={(e) => updateLocalRecord(record.id, "remarks", e.target.value)}
                          className="text-xs border rounded px-2 py-1 w-full"
                          placeholder="Add remarks..."
                        />
                      ) : (
                        record.remarks || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() =>
                          setEditingRecord(editingRecord === record.id ? null : record.id)
                        }
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        {editingRecord === record.id ? "Save" : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
