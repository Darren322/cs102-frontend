import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Play, Square, Users, Clock, Settings, FileText, User, Edit3, Check, X } from "lucide-react";

// Types for events and attendance records
type PresentEvent = {
  type: "present" | "left";
  studentId?: string;
  name?: string;
  conf?: number;
  at?: number;
};

type DetsMsg = {
  type: "dets";
  seq: number;
  dets: Array<{ name?: string; confidence?: number }>;
};

type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  timestamp: number;
  confidence: number;
  markingType: 'automatic' | 'manual';
  status: 'present' | 'absent' | 'late';
  remarks: string;
};

export default function SmartAttendanceSystem() {
  // Refs for media + transport
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const serverImgRef = useRef<HTMLImageElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const busyRef = useRef(false);
  const lastUrlRef = useRef<string | null>(null);
  const seqRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sessionActive, setSessionActive] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState<'live' | 'upload' | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // Manual attendance state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  // Attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [presentList, setPresentList] = useState<Array<{ name: string; since: number }>>([]);

  // Config
  const WIDTH = 640;
  const HEIGHT = 480;
  const WS_URL = "ws://localhost:8081/ws/live-scan";

  // Generate session ID
  const generateSessionId = () => {
    return `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Start new session
  const startSession = (mode: 'live' | 'upload') => {
    const sessionId = generateSessionId();
    setCurrentSessionId(sessionId);
    setRecognitionMode(mode);
    setSessionActive(true);
    if (mode === 'live') {
      setRunning(true);
    }
  };

  // Stop session
  const stopSession = () => {
    setSessionActive(false);
    setRunning(false);
    setRecognitionMode(null);
    setCurrentSessionId("");
    setPresentList([]);
  };

  // Add attendance record (with duplicate prevention)
  // Add attendance record (with duplicate prevention)
  // Add attendance record (with duplicate prevention)
  const addAttendanceRecord = (studentId: string, confidence: number = 1.0, markingType: 'automatic' | 'manual' = 'automatic', remarks: string = '') => {
    // Check if the student is already marked as present in the current session
    const existingRecord = attendanceRecords.find(
      (record) =>
        record.studentId === studentId &&
        record.sessionId === currentSessionId &&
        record.status === 'present'
    );

    // If the student is already marked as present, skip adding another record
    if (existingRecord) {
      console.log(`Student ${studentId} is already marked present in this session. Skipping.`);
      return false; // No new record added
    }

    // If no existing record found, create a new attendance record
    const newRecord: AttendanceRecord = {
      id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: currentSessionId,
      studentId,
      timestamp: Date.now(),
      confidence: confidence > 1 ? confidence : confidence * 100, // Convert confidence to percentage if it's < 1
      markingType,
      status: 'present',
      remarks
    };

    // Add the new record to the state, check for duplicates before updating state
    setAttendanceRecords((prev) => {
      // Check if the student is already present in the state to avoid duplicates
      const existingIndex = prev.findIndex(
        (record) =>
          record.studentId === studentId &&
          record.sessionId === currentSessionId &&
          record.status === 'present'
      );

      if (existingIndex !== -1) {
        console.log(`Student ${studentId} is already marked as present in the records. Skipping.`);
        return prev; // Skip adding if the record exists
      }

      // If no duplicate, add the new record
      return [newRecord, ...prev]; // Add the new record at the start
    });

    console.log(`Attendance marked for student ${studentId} in session ${currentSessionId}`);
    return true; // Return true to indicate a record was successfully added
  };


  // Manual attendance entry (with duplicate check)
  const handleManualEntry = () => {
    if (manualStudentId.trim()) {
      const wasAdded = addAttendanceRecord(manualStudentId, 1.0, 'manual', manualRemarks);
      if (wasAdded) {
        setManualStudentId("");
        setManualRemarks("");
        setShowManualEntry(false);
      } else {
        // Show error message if student already marked
        setErr(`Student ${manualStudentId} is already marked present in this session`);
        setTimeout(() => setErr(""), 3000); // Clear error after 3 seconds
      }
    }
  };

  // Handle file upload (with duplicate prevention)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Simulate processing uploaded image
      setTimeout(() => {
        // Mock detection results
        const mockStudents = ['STUDENT_001', 'STUDENT_002', 'STUDENT_003'];
        const newlyAdded: string[] = [];

        mockStudents.forEach(id => {
          const wasAdded = addAttendanceRecord(id, 85 + Math.random() * 10, 'automatic', 'Detected from uploaded image');
          if (wasAdded) {
            newlyAdded.push(id);
          }
        });

        if (newlyAdded.length > 0) {
          console.log(`Added ${newlyAdded.length} new attendance records from uploaded image`);
        }
      }, 1000);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update record
  const updateRecord = (id: string, field: keyof AttendanceRecord, value: any) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.id === id ? { ...record, [field]: value } : record
      )
    );
  };

  // Camera setup
  useEffect(() => {
    if (recognitionMode !== 'live') return;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: WIDTH, height: HEIGHT, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setErr(String(e));
      }
    })();
    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
    };
  }, [recognitionMode]);

  // WebSocket connection
  // WebSocket connection
  useEffect(() => {
    if (!running || recognitionMode !== 'live') {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    const ws = new WebSocket(WS_URL);
    ws.binaryType = "blob";
    wsRef.current = ws;

    ws.onopen = () => setErr("");
    ws.onerror = () => setErr("WebSocket error");
    ws.onclose = () => { };

    ws.onmessage = (ev) => {
      // Check if message is a JPEG binary frame
      if (typeof ev.data !== "string") {
        const url = URL.createObjectURL(ev.data as Blob);
        const imgEl = serverImgRef.current;
        if (imgEl) {
          if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
          imgEl.src = url;
          lastUrlRef.current = url;
        }
        return;
      }

      // If the message is JSON (attendance or detections event)
      try {
        const msg = JSON.parse(ev.data) as PresentEvent | DetsMsg | any;


        // Handle attendance events
        if (msg.type === "present" || msg.type === "left") {
          const name = (msg as PresentEvent).name || (msg as any).studentId || "Unknown";
          const confidence = (msg as PresentEvent).conf || 80; // Assuming backend sends as percentage

          // Skip if student is already present in the session
          const existingRecord = attendanceRecords.find(
            (record) =>
              record.studentId === (msg as PresentEvent).studentId &&
              record.sessionId === currentSessionId &&
              record.status === 'present'
          );

          if (existingRecord) {
            console.log(`Skipping duplicate record for student ${name} in session ${currentSessionId}`);
            return;
          }

          if (msg.type === "present") {
            const wasAdded = addAttendanceRecord(name, confidence, 'automatic', 'Auto-detected via live recognition');
            // Only add to present list if attendance record was successfully added (not duplicate)
            if (wasAdded) {
              setPresentList((prev) => {
                if (prev.some((p) => p.name === name)) return prev;
                return [...prev, { name, since: Date.now() }];
              });
            }
          } else {
            setPresentList((prev) => prev.filter((p) => p.name !== name));
          }
          return;
        }

        // Handle detection events
        if (msg.type === "dets" && Array.isArray(msg.dets)) {
          const names = (msg as DetsMsg).dets
            .map((d) => d.name)
            .filter((n): n is string => !!n && n !== "Unknown");
          if (names.length) {
            const now = Date.now();
            const newlyAddedNames: string[] = [];

            names.forEach((name) => {
              const detection = (msg as DetsMsg).dets.find((d) => d.name === name);
              const confidence = detection?.confidence || 80; // Assuming backend sends as percentage

              // Check if the student is already marked as present
              const wasAdded = addAttendanceRecord(name, confidence, 'automatic', 'Auto-detected via live recognition');
              if (wasAdded) {
                newlyAddedNames.push(name);
              }
            });

            // Only update present list for newly added students
            if (newlyAddedNames.length > 0) {
              setPresentList((prev) => {
                const set = new Set(prev.map((p) => p.name));
                for (const n of newlyAddedNames) {
                  if (!set.has(n)) {
                    prev = [...prev, { name: n, since: now }];
                  }
                }
                return prev.slice();
              });
            }
          }
        }
      } catch {
        // If JSON parsing fails, do nothing
      }
    };

    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [running, recognitionMode, currentSessionId]);


  // Capture & send frames to backend
  useEffect(() => {
    if (!running || recognitionMode !== 'live') return;
    let timer = 0 as unknown as number;

    const tick = () => {
      if (busyRef.current) {
        timer = window.setTimeout(tick, 1);
        return;
      }
      const video = videoRef.current!;
      const cap = captureRef.current!;
      if (!video || !cap || video.readyState < 2) {
        timer = window.setTimeout(tick, 60);
        return;
      }

      const vw = (video as any).videoWidth || WIDTH;
      const vh = (video as any).videoHeight || HEIGHT;

      cap.width = vw;
      cap.height = vh;
      const ctx = cap.getContext("2d")!;
      ctx.drawImage(video, 0, 0, cap.width, cap.height);

      busyRef.current = true;
      cap.toBlob(
        (blob) => {
          busyRef.current = false;

          if (!blob || !blob.size) {
            timer = window.setTimeout(tick, 10);
            return;
          }
          const ws = wsRef.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            timer = window.setTimeout(tick, 50);
            return;
          }
          if (ws.bufferedAmount > 2_000_000) {
            timer = window.setTimeout(tick, 10);
            return;
          }
          try {
            const seq = seqRef.current++;
            ws.send(JSON.stringify({ type: "frame", seq }));
            ws.send(blob);
          } catch {
            setErr("Send failed");
          } finally {
            timer = window.setTimeout(tick, 5);
          }
        },
        "image/jpeg",
        0.5
      );
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [running, recognitionMode]);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Users },
    { id: "sessions", label: "Sessions", icon: Clock },
    { id: "students", label: "Students", icon: User },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Smart Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">Professor Dashboard</p>
        </div>

        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${activeTab === item.id
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Session Status */}
        
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeTab === "dashboard" ? "Attendance Dashboard" :
                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-gray-600 mt-1">Manage and track student attendance</p>
              </div>

              {activeTab === "dashboard" && !sessionActive && (
                <div className="flex gap-3">
                  <button
                    onClick={() => startSession('live')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera size={18} className="mr-2" />
                    Live Recognition
                  </button>
                  <button
                    onClick={() => startSession('upload')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Upload size={18} className="mr-2" />
                    Upload Image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Session Controls */}
                {sessionActive && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Active Session</h3>
                        <p className="text-gray-600">Session ID: {currentSessionId}</p>
                        <p className="text-sm text-gray-500">Mode: {recognitionMode?.toUpperCase()}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {recognitionMode === 'live' && (
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

                    {/* Recognition Interface */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        {recognitionMode === 'live' ? (
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

                      {/* Live Present List */}
                      <div>
                        <h4 className="font-semibold mb-3">Currently Present</h4>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                          {presentList.length === 0 ? (
                            <p className="text-gray-500 text-center">No students detected yet</p>
                          ) : (
                            <div className="space-y-2">
                              {presentList.map((student, i) => (
                                <div key={student.name} className="flex justify-between items-center bg-white p-3 rounded border">
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

                    {/* Manual Entry Form */}
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
                              onClick={handleManualEntry}
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

                {/* Attendance Records Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
                    <p className="text-sm text-gray-600">All attendance records for current and past sessions</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marking Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceRecords.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                              No attendance records yet. Start a session to begin tracking attendance.
                            </td>
                          </tr>
                        ) : (
                          attendanceRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.sessionId.split('_')[1]}...
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {record.studentId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(record.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${record.confidence >= 90 ? 'bg-green-500' :
                                      record.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></div>
                                  {record.confidence.toFixed(1)}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingRecord === record.id ? (
                                  <select
                                    value={record.markingType}
                                    onChange={(e) => updateRecord(record.id, 'markingType', e.target.value as 'automatic' | 'manual')}
                                    className="text-xs border rounded px-2 py-1"
                                  >
                                    <option value="automatic">Automatic</option>
                                    <option value="manual">Manual</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.markingType === 'automatic'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                    }`}>
                                    {record.markingType}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingRecord === record.id ? (
                                  <select
                                    value={record.status}
                                    onChange={(e) => updateRecord(record.id, 'status', e.target.value)}
                                    className="text-xs border rounded px-2 py-1"
                                  >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {record.status}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {editingRecord === record.id ? (
                                  <input
                                    type="text"
                                    value={record.remarks}
                                    onChange={(e) => updateRecord(record.id, 'remarks', e.target.value)}
                                    className="text-xs border rounded px-2 py-1 w-full"
                                    placeholder="Add remarks..."
                                  />
                                ) : (
                                  record.remarks || '-'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setEditingRecord(editingRecord === record.id ? null : record.id)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  {editingRecord === record.id ? 'Save' : 'Edit'}
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
            )}

            {/* Other tabs content */}
            {activeTab !== "dashboard" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content will be implemented here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
