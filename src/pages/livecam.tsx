import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Play, Square, Users, Clock, Settings, FileText, User, Edit3, Check, X, School, Plus } from "lucide-react";
import { Live } from "../components/dashboard";
import { Session } from "../components/sessions";
import { Students } from "../components/students";

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
    { id: "dashboard", label: "Dashboard", icon: Users, text: "Managed your Dashboard here." },
    { id: "sessions", label: "Sessions", icon: Clock, text: "Manage your sesions." },
    { id: "students", label: "Students", icon: User, text:"Manage or add students here." },
    { id: "settings", label: "Settings", icon: Settings, text: "" },

  ];
  let curText = sidebarItems.find((tab)=>tab.id == activeTab);

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
                
                <p className="text-gray-600 mt-1">{curText['text']}</p>
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

              {activeTab === "sessions" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => startSession('live')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} className="mr-2" />
                    Create Sessions
                  </button>
                </div>
              )}

              {activeTab === "students" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => startSession('live')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Students
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "dashboard" && (
              <Live
                sessionActive={sessionActive}
                currentSessionId={currentSessionId}
                recognitionMode={recognitionMode}
                running={running}
                err={err}
                presentList={presentList}
                attendanceRecords={attendanceRecords}
                editingRecord={editingRecord}
                showManualEntry={showManualEntry}
                manualStudentId={manualStudentId}
                manualRemarks={manualRemarks}
                videoRef={videoRef}
                serverImgRef={serverImgRef}
                captureRef={captureRef}
                fileInputRef={fileInputRef}
                WIDTH={WIDTH}
                HEIGHT={HEIGHT}
                setRunning={setRunning}
                setShowManualEntry={setShowManualEntry}
                stopSession={stopSession}
                handleFileUpload={handleFileUpload}
                handleManualEntry={handleManualEntry}
                updateRecord={updateRecord}
                setEditingRecord={setEditingRecord}
              />
            )}
            {
              activeTab == "sessions" && (
                <Session
                  attendanceRecords={attendanceRecords}
                  editingRecord={editingRecord}
                  updateRecord={updateRecord}
                  setEditingRecord={setEditingRecord}
                />
              )
            }

            {
              activeTab == "students" && (
                <Students
                  attendanceRecords={attendanceRecords}
                  editingRecord={editingRecord}
                  updateRecord={updateRecord}
                  setEditingRecord={setEditingRecord}
                />
              )
            }

          </div>
        </div>
      </div>
    </div>
  );
}
