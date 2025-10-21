import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Plus, SettingsIcon, Users, Clock, User, Highlighter, File, FileSpreadsheet } from "lucide-react";
import { Live } from "../components/dashboard";
import { Session } from "../components/sessions";
import { Settings } from "../components/settings";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { activateCourse, closeCourse, getCurrentSession } from "@/components/api/backend-methods/Sessions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { batchMark } from "@/components/api/backend-methods/AttendanceRecord";
import { toast } from "sonner";
import { csvExport, pdfExport } from "@/components/api/backend-methods/pdf-csv";
import { automaticMark } from "@/components/api/backend-methods/AttendanceRecord";
import ImportAttendanceButton from "@/components/ui/import-csv-button";

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
  markingType: "automatic" | "manual";
  status: "present" | "absent" | "late";
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
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchStatus, setBatchStatus] = useState("ABSENT");
  const [batchRemarks, setBatchRemarks] = useState("");
  const [currentSession, setCurrentSession] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sessionActive, setSessionActive] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState<"live" | "upload" | null>(null);
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

  // FPS state
  const [fps, setFps] = useState(0);            // frames sent per second (camera -> backend)
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef<number | null>(null);
  const id = useParams().id;
  // (Optional) received FPS if you also want to show server->client stream rate
  const [recvFps, setRecvFps] = useState(0);
  const recvCountRef = useRef(0);
  const recvFpsTimerRef = useRef<number | null>(null);

  // === Camera Picker: ADD STATE + HELPERS (paste with your other useState hooks) ===
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraErr, setCameraErr] = useState<string | null>(null);

  // Safely attach a new stream to the <video> without triggering AbortError
  const setStreamSafely = async (video: HTMLVideoElement, newStream: MediaStream) => {
    // try to pause any pending play on old stream (ignore errors)
    try { await video.pause(); } catch { }

    // clear srcObject to cancel previous load/play cleanly
    video.srcObject = null;

    // attach the new stream
    video.srcObject = newStream;

    // ensure autoplay works well on mobile
    (video as any).playsInline = true;
    video.muted = true;

    // wait until we have metadata (dimensions)
    await new Promise<void>((resolve) => {
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      if ((video as any).readyState >= 1) resolve();
      else video.addEventListener("loadedmetadata", onMeta, { once: true });
    });

    // now play; swallow AbortError (harmless) but surface others
    await video.play().catch((e: any) => {
      if (e?.name !== "AbortError") throw e;
    });
  };


  // List available cameras (ensures permission so labels/deviceIds are available)
  const refreshCameras = async () => {
    setCameraErr(null);
    setCameraLoading(true);
    try {
      // Ensure labels/deviceIds are revealed (stops immediately after)
      const temp = await navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .catch(() => null);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter((d) => d.kind === "videoinput");

      setCameras(vids);

      // Prefer a concrete deviceId (not "default" / not empty)
      const preferred =
        vids.find(v => v.deviceId && v.deviceId !== "default") ?? vids[0] ?? null;

      setSelectedCameraId(
        preferred && preferred.deviceId && preferred.deviceId !== "default"
          ? preferred.deviceId
          : null  // null means: let the browser pick (works when only "default" exists)
      );

      if (temp) temp.getTracks().forEach(t => t.stop());

      // Optional: if exactly one camera, auto-close the picker
      // if (vids.length === 1) setShowCameraDialog(false);
    } catch (e: any) {
      setCameraErr(e?.message ?? "Unable to list cameras.");
    } finally {
      setCameraLoading(false);
    }
  };


  // Open the modal
  const openCameraPicker = async () => {
    await refreshCameras();
    setShowCameraDialog(true);
  };

  // Confirm selection (we just close; swapping is handled by an effect below)
  const confirmCameraSelection = () => {
    // Even if selectedCameraId is null (only "default"), proceed and let browser pick it
    setShowCameraDialog(false);
  };



  // Config
  const WIDTH = 640;
  const HEIGHT = 480;
  const WS_BASE = "ws://localhost:8081/ws/live-scan";
  const buildWsUrl = (sessionId: string) =>
    `${WS_BASE}?sessionId=${encodeURIComponent(sessionId)}`;
  const detectionsRef = useRef<any[]>([]);

  // Generate session ID
  const generateSessionId = () => {
    return `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Start new session
  const startSession = (mode: "live" | "upload") => {
    const sessionId = generateSessionId();
    setCurrentSessionId(sessionId);
    setRecognitionMode(mode);
    setSessionActive(true);
    if (mode === "live") {
      setRunning(true);
      openCameraPicker();
    }
  };


  // Stop session
  const stopSession = () => {
    setSessionActive(false);
    setRunning(false);
    setRecognitionMode(null);
    setCurrentSessionId("");
    setPresentList([]);
    setSelectedCameraId(null); // 👈 reset so the picker auto-opens next time
  };

  // Add attendance record (with duplicate prevention)
  const addAttendanceRecord = (
    studentId: string,
    confidence: number = 1.0,
    markingType: "automatic" | "manual" = "automatic",
    remarks: string = ""
  ) => {
    // Check if the student is already marked as present in the current session
    const existingRecord = attendanceRecords.find(
      (record) =>
        record.studentId === studentId &&
        record.sessionId === currentSessionId &&
        record.status === "present"
    );

    if (existingRecord) {
      console.log(`Student ${studentId} is already marked present in this session. Skipping.`);
      return false;
    }

    const newRecord: AttendanceRecord = {
      id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: currentSessionId,
      studentId,
      timestamp: Date.now(),
      confidence: confidence > 1 ? confidence : confidence * 100,
      markingType,
      status: "present",
      remarks,
    };

    setAttendanceRecords((prev) => {
      const dupIdx = prev.findIndex(
        (record) =>
          record.studentId === studentId &&
          record.sessionId === currentSessionId &&
          record.status === "present"
      );
      if (dupIdx !== -1) return prev;
      return [newRecord, ...prev];
    });

    console.log(`Attendance marked for student ${studentId} in session ${currentSessionId}`);
    return true;
  };

  getCurrentSession(id).then((response) => {
    setCurrentSession(response.data.sessionID);

  }).catch((err) => {
    console.error("cant get session data? possibly wrong id")
  })

  // Manual attendance entry (with duplicate check)
  const handleManualEntry = () => {
    if (manualStudentId.trim()) {
      const wasAdded = addAttendanceRecord(manualStudentId, 1.0, "manual", manualRemarks);
      if (wasAdded) {
        setManualStudentId("");
        setManualRemarks("");
        setShowManualEntry(false);
      } else {
        setErr(`Student ${manualStudentId} is already marked present in this session`);
        setTimeout(() => setErr(""), 3000);
      }
    }
  };

  // Handle file upload (with duplicate prevention)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Simulate processing uploaded image
      setTimeout(() => {
        const mockStudents = ["STUDENT_001", "STUDENT_002", "STUDENT_003"];
        const newlyAdded: string[] = [];

        mockStudents.forEach((id) => {
          const wasAdded = addAttendanceRecord(
            id,
            85 + Math.random() * 10,
            "automatic",
            "Detected from uploaded image"
          );
          if (wasAdded) newlyAdded.push(id);
        });

        if (newlyAdded.length > 0) {
          console.log(`Added ${newlyAdded.length} new attendance records from uploaded image`);
        }
      }, 1000);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Update record
  const updateRecord = (id: string, field: keyof AttendanceRecord, value: any) => {
    setAttendanceRecords((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };




  // Camera setup
  // Camera setup
  useEffect(() => {
    if (recognitionMode !== "live") return;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: WIDTH, height: HEIGHT, facingMode: "user" },
          audio: false,
        });
        const video = videoRef.current;
        if (video) {
          await setStreamSafely(video, stream); // 👈 use the safe setter
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




  // === Camera Picker: AUTO-OPEN ON LIVE (ADD) ===
  useEffect(() => {
    if (recognitionMode === "live" && sessionActive) {
      if (!selectedCameraId) openCameraPicker();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognitionMode, sessionActive]);


  // === Camera Picker: SWAP STREAM WHEN CAMERA CHANGES (ADD) ===
  useEffect(() => {
    const swapToSelectedCamera = async () => {
      if (recognitionMode !== "live" || !running || !selectedCameraId) return;

      try {
        const constraints: MediaStreamConstraints = {
          video: { width: WIDTH, height: HEIGHT, deviceId: { exact: selectedCameraId } },
          audio: false,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Stop old tracks
        const old = (videoRef.current?.srcObject as MediaStream | null) ?? null;
        if (old) old.getTracks().forEach((t) => t.stop());

        // ✅ Use the safe helper instead of direct play()
        const video = videoRef.current;
        if (video) {
          await setStreamSafely(video, newStream);
        }
      } catch (e: any) {
        setErr(String(e?.message || e));
      }
    };

    swapToSelectedCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);


  // === Camera Picker: KEEP LIST FRESH ON DEVICE CHANGES (ADD) ===
  useEffect(() => {
    const handler = () => { refreshCameras().catch(() => { }); };
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handler);
    } else {
      (navigator.mediaDevices as any).ondevicechange = handler;
    }
    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handler);
      } else {
        (navigator.mediaDevices as any).ondevicechange = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ✅ Outside and at top level — after your WebSocket setup
  useEffect(() => {
    const interval = setInterval(async () => {
      if (detectionsRef.current.length > 0) {
        // Deduplicate detections
        const unique = Object.values(
          detectionsRef.current.reduce((acc, det) => {
            acc[det.name] = det;
            return acc;
          }, {} as Record<string, any>)
        );

        console.log("🕔 Flushing unique detections:", unique);

        // Build payload for backend
        const payload = unique
          .filter((d: any) => d?.name && d?.confidence >= 80) // optional threshold
          .map((d: any) => ({
            studentId: d.name,
            confidence: d.confidence,
            timestamp: new Date().toISOString(),
            recordedBy: localStorage['username']
          }));

        try {
          const res = await automaticMark(currentSession, payload);
          console.log("✅ Auto-marked successfully:", res);
          toast.success(`Auto-marked ${payload.length} student(s)`);
        } catch (err) {
          console.error("❌ Auto-marking failed:", err);
        }

        // Clear buffer
        detectionsRef.current = [];
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSession]);
  // WebSocket connection
  useEffect(() => {
    if (!running || recognitionMode !== "live") {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }
    const ws = new WebSocket(buildWsUrl(currentSession));
    ws.binaryType = "blob";
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "hello", sessionId: id, mode: recognitionMode }));
    };
    ws.onerror = () => setErr("WebSocket error");
    ws.onclose = () => { };

    // Start recv FPS ticker on connect
    recvFpsTimerRef.current = window.setInterval(() => {
      setRecvFps(recvCountRef.current);
      recvCountRef.current = 0;
    }, 1000) as unknown as number;

    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") {
        console.log(ev.data)
        recvCountRef.current += 1; // count received frames
        const url = URL.createObjectURL(ev.data as Blob);
        const imgEl = serverImgRef.current;
        if (imgEl) {
          if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
          imgEl.src = url;
          lastUrlRef.current = url;
        }
        return;
      }
      try {
        const msg = JSON.parse(ev.data) as PresentEvent | DetsMsg | any;
        //this is what we will send to backend.
        console.log(msg);
        if (msg.type === "dets" && Array.isArray(msg.dets)) {
          detectionsRef.current.push(...msg.dets);
        }
        // Handle attendance events
        if (msg.type === "present" || msg.type === "left") {
          const name = (msg as PresentEvent).name || (msg as any).studentId || "Unknown";
          const confidence = (msg as PresentEvent).conf || 80;

          const existingRecord = attendanceRecords.find(
            (record) =>
              record.studentId === (msg as PresentEvent).studentId &&
              record.sessionId === currentSessionId &&
              record.status === "present"
          );

          if (existingRecord) {
            console.log(`Skipping duplicate record for student ${name} in session ${currentSessionId}`);
            return;
          }

          if (msg.type === "present") {
            const wasAdded = addAttendanceRecord(
              name,
              confidence,
              "automatic",
              "Auto-detected via live recognition"
            );
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
              const confidence = detection?.confidence || 80;
              const wasAdded = addAttendanceRecord(
                name,
                confidence,
                "automatic",
                "Auto-detected via live recognition"
              );
              if (wasAdded) newlyAddedNames.push(name);
            });

            if (newlyAddedNames.length > 0) {
              setPresentList((prev) => {
                const set = new Set(prev.map((p) => p.name));
                let next = prev.slice();
                for (const n of newlyAddedNames) {
                  if (!set.has(n)) next.push({ name: n, since: now });
                }
                return next;
              });
            }
          }
        }
      } catch {
      }
    };

    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;

      if (recvFpsTimerRef.current != null) {
        window.clearInterval(recvFpsTimerRef.current);
        recvFpsTimerRef.current = null;
      }
      setRecvFps(0);
    };
  }, [running, recognitionMode, currentSessionId, attendanceRecords]);

  useEffect(() => {
    if (!running || recognitionMode !== "live") return;
    let timer = 0 as unknown as number;
    fpsTimerRef.current = window.setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000) as unknown as number;

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
            frameCountRef.current += 1;
          } catch {
            setErr("Send failed");
          } finally {
            timer = window.setTimeout(tick, 5);
          }
        },
        "image/jpeg",
        0.85
      );
    };

    tick();
    return () => {
      window.clearTimeout(timer);
      if (fpsTimerRef.current != null) {
        window.clearInterval(fpsTimerRef.current);
        fpsTimerRef.current = null;
      }
      setFps(0);
    };
  }, [running, recognitionMode]);
  console.log(activeTab)

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Users, text: "Managed your Dashboard here." },
    { id: "sessions", label: "Sessions", icon: Clock, text: "Manage your sesions." },
    { id: "students", label: "Students", icon: User, text: "Manage or add students here." },
    { id: "settings", label: "Settings", icon: SettingsIcon, text: "Modify Settings" },
  ];
  const curText = sidebarItems.find((tab) => tab.id === activeTab);
  console.log(activeTab)


  console.log(id)
  const [isCurrentClosed, setIsCurrentClosed] = useState(false)
  const [isCurrentActive, setIsCurrentActive] = useState(false)

  useEffect(() => {
    getCurrentSession(id).then((response) => {
      setCurrentSession(response.data.sessionID);
      console.log(response.data.active)
      console.log(response.data.closed)
      setIsCurrentActive(response.data.active)
      setIsCurrentClosed(response.data.closed)
    }).catch((err) => {
      console.error(err)
    })
  }, [id])

  const [isSubmitted, setIsSubmitted] = useState(false)
  const handleSubmission = () => {
    console.log('hi')
    let payload = {
      "status": batchStatus,
      "optionalNotes": `${batchRemarks}`,
      "recordedBy": localStorage['username']
    }
    batchMark(payload, id).then((response) => {
      console.log(response)
      setShowBatchDialog(false)
      setIsSubmitted(true)
      toast.success('Successfully updated!')
    }).catch((err) => {
      console.error(err)
    })
  }
  console.log(isCurrentClosed)

  const handleActive = () => {
    if (!id) return;

    activateCourse(id)
      .then((response) => {
        toast.success("Successfully set to Active");
        setIsCurrentActive(true); // ✅ instantly reflect state change
      })
      .catch(() => {
        toast.error("Unable to set active.");
      });
  };
  const navigate = useNavigate();

  const closeSession = () => {
    if (!id) return;

    closeCourse(id).then((response) => {
      toast.success("Successfully set to Closed");
      navigate(`/session_start/${id}`);
    }).catch((error) => {
      toast.error("Unable to set to close.")
    })
  }
  //Able to get unique detections alr. DONT MODIFY HERE
  useEffect(() => {
    const interval = setInterval(() => {
      if (detectionsRef.current.length > 0) {
        // ✅ Deduplicate by name (only keep one detection per person)
        const unique = Object.values(
          detectionsRef.current.reduce((acc, det) => {
            acc[det.name] = det; // overwrite older ones by name
            return acc;
          }, {} as Record<string, any>)
        );

        console.log("🕔 Flushing unique detections:", unique);

        // clear buffer after flush
        detectionsRef.current = [];
      } else {
        console.log("🕔 No new detections yet...");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  const exportPDF = () => {
    pdfExport(id).then((response) => {
      console.log(response)
      setConfirmationDialog(false)
      toast.success('Sent PDF Successfully and emailed.')
    }).catch((error) => {
      console.error(error)
      setConfirmationDialog(false)
      toast.error('PDF did not manage to send and emailed.')
    })
  }

  const exportCSV = () => {
    csvExport(id).then((response) => {
      console.log(response)
      setConfirmationDialog(false)
      toast.success('Sent CSV Successfully and emailed.')
    }).catch((error) => {
      console.error(error)
      setConfirmationDialog(false)
      toast.error('CSV did not manage to send and emailed.')
    })
  }
  const [confirmationDialog, setConfirmationDialog] = useState(false)
  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <div className="flex-1">
        <div className="h-full overflow-y-auto">
          <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm mx-8 mt-6">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {activeTab === "dashboard"
                    ? "Attendance Dashboard"
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-gray-300 mt-1">{curText?.text}</p>
              </div>

              {
                isCurrentClosed ? (
                  // Case 1: closed
                  <div className="grid grid-cols-1 gap-3">
                    <ImportAttendanceButton sessionId={ id ?? "" }/>
                    <Button
                      onClick={() => setConfirmationDialog(true)}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30
          font-medium rounded-2xl px-4 py-2 backdrop-blur-sm shadow-sm transition-all"
                    >
                      <Upload size={18} className="mr-2" />
                      Export
                    </Button>
                  </div>
                ) : !isCurrentActive ? (
                  // Case 2: not closed & not active
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => handleActive()}
                      className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-400/40 
          font-semibold rounded-2xl px-4 py-5 transition-all"
                    >
                      <SettingsIcon size={18} className="mr-2" />
                      Set to Active
                    </Button>
                  </div>
                ) : (
                  // Case 3: active & not closed
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => startSession("live")}
                      className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 transition-all rounded-2xl px-4 py-5"
                    >
                      <Camera size={18} className="mr-2" />
                      Live Recognition
                    </Button>
                    <Button
                      onClick={() => startSession("upload")}
                      className="bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-300 transition-all rounded-2xl px-4 py-5"
                    >
                      <Upload size={18} className="mr-2" />
                      Upload Image
                    </Button>
                    <Button
                      onClick={() => setShowBatchDialog(true)}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-4 py-5 border border-amber-400/40 backdrop-blur-sm 
          shadow-sm transition-all rounded-2xl"
                    >
                      <Highlighter size={18} className="mr-2" />
                      Batch Mark
                    </Button>

                    <Button
                      onClick={() => closeSession()}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold px-4 py-5 border border-red-400/40 backdrop-blur-sm 
          shadow-sm transition-all rounded-2xl"
                    >
                      <Highlighter size={18} className="mr-2" />
                      Close Session
                    </Button>
                  </div>
                )
              }

            </CardHeader>
          </Card>
          <div className="w-full">
            {activeTab === "dashboard" && (
              <Live
                sessionActive={sessionActive}
                currentSessionId={currentSessionId}
                recognitionMode={recognitionMode}
                running={running}
                isSubmitted={isSubmitted}
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
                fps={fps}
                recvFps={recvFps}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "sessions" && (
              <Session
                attendanceRecords={attendanceRecords}
                editingRecord={editingRecord}
                updateRecord={updateRecord}
                setEditingRecord={setEditingRecord}
              />
            )}


            {activeTab === "settings" && (
              <Settings
                attendanceRecords={attendanceRecords}
                editingRecord={editingRecord}
                updateRecord={updateRecord}
                setEditingRecord={setEditingRecord}
              />
            )}
          </div>
        </div>


      </div>
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-amber-300">
              Batch Mark Pending Students
            </DialogTitle>
          </DialogHeader>



          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-2">
              <Label className="text-sm text-gray-300">Status to Mark As</Label>
              <Select value={batchStatus} onValueChange={setBatchStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-2xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="MEDICAL">Medical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label className="text-sm text-gray-300">Remarks (Optional)</Label>
              <Input
                placeholder="e.g. Marked absent after 15 mins..."
                value={batchRemarks}
                onChange={(e) => setBatchRemarks(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white rounded-2xl"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border border-slate-700 text-gray-300 hover:bg-slate-800"
              onClick={() => setShowBatchDialog(false)}
            >
              Cancel
            </Button>

            <Button

              onClick={handleSubmission}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40"
            >
              Confirm Batch Mark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-blue-300">
              Choose a camera
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Pick which video input device to use for live recognition.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {cameraErr && <div className="text-red-400 text-sm">{cameraErr}</div>}

            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-300">Camera</Label>
              <Button
                variant="outline"
                className="ml-auto border border-slate-700 text-gray-300 hover:bg-slate-800 rounded-2xl"
                onClick={refreshCameras}
                disabled={cameraLoading}
              >
                {cameraLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            <Select
              value={selectedCameraId ?? undefined}
              onValueChange={(v) => setSelectedCameraId(v)}
              disabled={cameraLoading || !cameras.length}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-2xl">
                <SelectValue placeholder={cameraLoading ? "Loading..." : "Select camera"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {cameras.length ? (
                  cameras.map((cam, idx) => (
                    <SelectItem key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.label || `Camera ${idx + 1}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">No cameras found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border border-slate-700 text-gray-300 hover:bg-slate-800 rounded-2xl"
              onClick={() => setShowCameraDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCameraSelection}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 rounded-2xl"
              disabled={!selectedCameraId}
            >
              Use this camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>




      <Dialog open={confirmationDialog} onOpenChange={setConfirmationDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-slate-300">
              Choose your method of exporting.
            </DialogTitle>
          </DialogHeader>

          <div className="flex space-x-4">
            <div className="w-[50%]">
              <Button
                className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 
               rounded-2xl px-4 py-5 backdrop-blur-sm shadow-sm transition-all flex items-center justify-center gap-2"
                onClick={() => { exportPDF() }}
              >
                <File className="w-4 h-4" />
                PDF
              </Button>
            </div>
            <div className="w-[50%]">
              <Button
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 
               rounded-2xl px-4 py-5 backdrop-blur-sm shadow-sm transition-all flex items-center justify-center gap-2"
                onClick={() => { exportCSV() }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </Button>
            </div>

          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border border-slate-700 text-gray-300 hover:bg-slate-800 rounded-2xl"
              onClick={() => setConfirmationDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
