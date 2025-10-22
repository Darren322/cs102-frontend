import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Upload, SettingsIcon, Users, Clock, User, Highlighter, File, FileSpreadsheet, Loader2 } from "lucide-react";
import { Live } from "../components/dashboard";

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
import { scanPhoto } from "@/components/api/backend-methods/Recognition";

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

  // Upload preview canvas (for upload mode)
  const uploadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Non-rendering error store
  const errorRef = useRef<string>("");

  // Dialog state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchStatus, setBatchStatus] = useState("ABSENT");
  const [batchRemarks, setBatchRemarks] = useState("");
  const [confirmationDialog, setConfirmationDialog] = useState(false);

  // Backend session ID for WS/marking
  const [currentSession, setCurrentSession] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sessionActive, setSessionActive] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState<"live" | "upload" | null>(null);
  const [running, setRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(""); // client-side session id

  // Manual attendance (kept here if you want to bubble into Live later)
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  // Attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [presentList, setPresentList] = useState<Array<{ name: string; since: number }>>([]);

  // FPS state
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef<number | null>(null);
  const id = useParams().id;
  const [recvFps, setRecvFps] = useState(0);
  const recvCountRef = useRef(0);
  const recvFpsTimerRef = useRef<number | null>(null);

  // Camera picker
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraErr, setCameraErr] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);

  // Safely attach a new stream to the <video>
  const setStreamSafely = useCallback(async (video: HTMLVideoElement, newStream: MediaStream) => {
    try { await video.pause(); } catch { }
    video.srcObject = null;
    video.srcObject = newStream;
    (video as any).playsInline = true;
    video.muted = true;

    await new Promise<void>((resolve) => {
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      if ((video as any).readyState >= 1) resolve();
      else video.addEventListener("loadedmetadata", onMeta, { once: true });
    });

    await video.play().catch((e: any) => {
      if (e?.name !== "AbortError") throw e;
    });
  }, []);

  // List available cameras
  const refreshCameras = useCallback(async () => {
    setCameraErr(null);
    setCameraLoading(true);
    try {
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).catch(() => null);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter((d) => d.kind === "videoinput");
      setCameras(vids);

      const preferred = vids.find(v => v.deviceId && v.deviceId !== "default") ?? vids[0] ?? null;
      setSelectedCameraId(preferred && preferred.deviceId && preferred.deviceId !== "default" ? preferred.deviceId : null);
      if (temp) temp.getTracks().forEach(t => t.stop());
    } catch (e: any) {
      setCameraErr(e?.message ?? "Unable to list cameras.");
    } finally {
      setCameraLoading(false);
    }
  }, []);

  const openCameraPicker = useCallback(async () => {
    await refreshCameras();
    setShowCameraDialog(true);
  }, [refreshCameras]);

  const confirmCameraSelection = useCallback(() => {
    setShowCameraDialog(false);
  }, []);

  // Config
  const WIDTH = 640;
  const HEIGHT = 480;
  const WS_BASE = "ws://localhost:8081/ws/live-scan";
  const buildWsUrl = (sessionId: string) => `${WS_BASE}?sessionId=${encodeURIComponent(sessionId)}`;
  const detectionsRef = useRef<any[]>([]);

  // Generate client-side session ID
  const generateSessionId = () => `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Start/stop sessions
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

  const stopSession = () => {
    setSessionActive(false);
    setRunning(false);
    setRecognitionMode(null);
    setCurrentSessionId("");
    setPresentList([]);
    setSelectedCameraId(null);

    // clear the upload preview canvas when ending session
    const c = uploadCanvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx?.clearRect(0, 0, c.width, c.height);
    }
  };

  // Add attendance record — duplicate prevention INSIDE updater
  const addAttendanceRecord = useCallback((
    studentId: string,
    confidence: number = 1.0,
    markingType: "automatic" | "manual" = "automatic",
    remarks: string = ""
  ) => {
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

    let added = false;
    setAttendanceRecords(prev => {
      const dup = prev.find(
        r => r.studentId === studentId && r.sessionId === currentSessionId && r.status === "present"
      );
      if (dup) return prev;
      added = true;
      return [newRecord, ...prev];
    });

    if (added) {
      console.log(`Attendance marked for student ${studentId} in session ${currentSessionId}`);
    } else {
      console.log(`Student ${studentId} already present in this session, skipping.`);
    }
    return added;
  }, [currentSessionId]);

  // ---------- helpers for the upload canvas ----------
  const drawImageToCanvas = (canvas: HTMLCanvasElement, img: ImageBitmap | HTMLImageElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const iw = (img as any).width, ih = (img as any).height;
    if (!iw || !ih) return;

    const scale = Math.min(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.drawImage(img as any, dx, dy, dw, dh);
  };

  const drawBlobToCanvas = async (canvas: HTMLCanvasElement, blob: Blob) => {
    const bmp = await createImageBitmap(blob);
    try {
      drawImageToCanvas(canvas, bmp);
    } finally {
      (bmp as any).close?.();
    }
  };

  const drawBase64ToCanvas = async (canvas: HTMLCanvasElement, base64: string) => {
    if (!base64 || !canvas) return;
    const dataUrl = base64.startsWith("data:")
      ? base64
      : `data:image/jpeg;base64,${base64}`;

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await drawBlobToCanvas(canvas, blob);
  };
  // ---------------------------------------------------

  // Upload photo -> draw → scan → (optionally draw annotated) → mark
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const canvas = uploadCanvasRef.current;

    if (!file || !file.type.startsWith("image/")) {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      // Draw the **raw uploaded image** immediately
      if (canvas) {
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        await drawBlobToCanvas(canvas, file);
      }

      // Send to backend (normalized to { dets, imageJpegBase64 })
      const result = await scanPhoto({ file, sessionId: currentSession });
      console.log(result)

      const dets = (result as any).dets ?? result ?? [];
      const curpl = (dets as any[])
        .filter((d) => d?.studentId && d?.studentId.toLowerCase() !== "unknown" && d?.confidence >= 80)
        .map((d) => ({
          studentId: d.studentId,
          confidence: d.confidence,
          timestamp: new Date().toISOString(),
          recordedBy: localStorage['username']
        }));
      try {
        if (curpl.length) {
          console.log(currentSession, curpl)
          const res = await automaticMark(currentSession, curpl);
          console.log("✅ Auto-marked successfully:", res);
          toast.success(`Auto-marked ${curpl.length} student(s)`);
        }
      } catch (e) {
        console.error("❌ Auto-marking failed:", e);
        errorRef.current = String(e);
        toast.error(errorRef.current);
      }
      console.log(dets)
      const imageJpegBase64: string | undefined = (result as any).imageJpegBase64;

      // If backend returns annotated image, draw that instead (REPLACE)
      if (canvas && imageJpegBase64 && imageJpegBase64.length > 0) {
        await drawBase64ToCanvas(canvas, imageJpegBase64);
      }

      // ---- Filter out "Unknown"/blank BEFORE marking ----
      const cleaned = (dets as any[])
        .map((d) => ({
          name: (d?.studentId ?? d?.name ?? "").toString().trim(),
          confidence: Number.isFinite(d?.confidence) ? d.confidence : 80,
        }))
        .filter((d) => d.name && d.name.toLowerCase() !== "unknown");

      // Unique by name
      const uniqueByName = Object.values(
        cleaned.reduce((acc: Record<string, { name: string; confidence: number }>, d) => {
          acc[d.name] = d;
          return acc;
        }, {})
      ) as Array<{ name: string; confidence: number }>;

      const now = Date.now();
      const newlyAdded: string[] = [];

      uniqueByName.forEach(({ name, confidence }) => {
        const wasAdded = addAttendanceRecord(
          name,
          confidence,
          "automatic",
          "Detected from uploaded image"
        );
        if (wasAdded) newlyAdded.push(name);
      });

      if (newlyAdded.length > 0) {
        setPresentList((prev) => {
          const set = new Set(prev.map((p) => p.name));
          const next = prev.slice();
          for (const n of newlyAdded) if (!set.has(n)) next.push({ name: n, since: now });
          return next;
        });
        console.log(`✅ Added ${newlyAdded.length} new attendance records from uploaded image`);
      }
    } catch (e: any) {
      console.error("❌ Photo scan failed:", e);
      errorRef.current = String(e);
      toast.error(errorRef.current);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Update a single record field
  const updateRecord = (id: string, field: keyof AttendanceRecord, value: any) => {
    setAttendanceRecords((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Camera setup (initial getUserMedia)
  useEffect(() => {
    if (recognitionMode !== "live") return;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: WIDTH, height: HEIGHT, facingMode: "user" },
          audio: false,
        });
        const video = videoRef.current;
        if (video) await setStreamSafely(video, stream);
      } catch (e: any) {
        errorRef.current = String(e);
        toast.error(errorRef.current);
      }
    })();

    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
    };
  }, [recognitionMode, setStreamSafely]);

  // Auto-open camera picker on live
  useEffect(() => {
    if (recognitionMode === "live" && sessionActive) {
      if (!selectedCameraId) openCameraPicker();
    }
  }, [recognitionMode, sessionActive, selectedCameraId, openCameraPicker]);

  // Swap stream when selected camera changes
  useEffect(() => {
    const swapToSelectedCamera = async () => {
      if (recognitionMode !== "live" || !running || !selectedCameraId) return;
      try {
        const constraints: MediaStreamConstraints = {
          video: { width: WIDTH, height: HEIGHT, deviceId: { exact: selectedCameraId } },
          audio: false,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const old = (videoRef.current?.srcObject as MediaStream | null) ?? null;
        if (old) old.getTracks().forEach((t) => t.stop());
        const video = videoRef.current;
        if (video) await setStreamSafely(video, newStream);
      } catch (e: any) {
        errorRef.current = String(e?.message || e);
        toast.error(errorRef.current);
      }
    };
    swapToSelectedCamera();
  }, [selectedCameraId, recognitionMode, running, setStreamSafely]);

  // Keep camera list fresh on device changes
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
  }, [refreshCameras]);

  // Periodic flush → backend auto mark
  useEffect(() => {
    const interval = setInterval(async () => {
      if (detectionsRef.current.length > 0) {
        const unique = Object.values(
          detectionsRef.current.reduce((acc, det) => {
            const nm = (det?.name ?? "").toString().trim();
            if (!nm || nm.toLowerCase() === "unknown") return acc;
            acc[nm] = det;
            return acc;
          }, {} as Record<string, any>)
        );

        const payload = (unique as any[])
          .filter((d) => d?.name && d?.name.toLowerCase() !== "unknown" && d?.confidence >= 80)
          .map((d) => ({
            studentId: d.name,
            confidence: d.confidence,
            timestamp: new Date().toISOString(),
            recordedBy: localStorage['username']
          }));

        try {
          if (payload.length) {
            const res = await automaticMark(currentSession, payload);
            console.log("✅ Auto-marked successfully:", res);
            toast.success(`Auto-marked ${payload.length} student(s)`);
          }
        } catch (e) {
          console.error("❌ Auto-marking failed:", e);
          errorRef.current = String(e);
          toast.error(errorRef.current);
        }

        detectionsRef.current = [];
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSession]);

  // WebSocket connection — independent of attendanceRecords
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
    ws.onerror = () => {
      errorRef.current = "WebSocket error";
      toast.error(errorRef.current);
    };
    ws.onclose = () => { };

    // Start recv FPS ticker on connect
    recvFpsTimerRef.current = window.setInterval(() => {
      setRecvFps(recvCountRef.current);
      recvCountRef.current = 0;
    }, 1000) as unknown as number;

    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") {
        recvCountRef.current += 1;
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

        if (msg.type === "dets" && Array.isArray(msg.dets)) {
          detectionsRef.current.push(...msg.dets);
        }

        if (msg.type === "present" || msg.type === "left") {
          const raw = (msg as PresentEvent).name || (msg as any).studentId || "";
          const name = raw ? raw.toString().trim() : "";
          const confidence = (msg as PresentEvent).conf || 80;

          // Skip unknown/blank names
          if (!name || name.toLowerCase() === "unknown") {
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
            setPresentList((prev) => prev.filter((p) => p.name !== name && !!p));
          }
          return;
        }

        if (msg.type === "dets" && Array.isArray(msg.dets)) {
          const names = (msg as DetsMsg).dets
            .map((d) => (d?.name ?? "").toString().trim())
            .filter((n): n is string => !!n && n.toLowerCase() !== "unknown");
          if (names.length) {
            const now = Date.now();
            const newlyAddedNames: string[] = [];

            names.forEach((name) => {
              const detection = (msg as DetsMsg).dets.find((d) => (d?.name ?? "").toString().trim() === name);
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
                  if (n && !set.has(n)) next.push({ name: n, since: now });
                }
                return next;
              });
            }
          }
        }
      } catch {
        // ignore parse errors
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
  }, [running, recognitionMode, currentSession, id, addAttendanceRecord]);

  // Send frames loop
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
            errorRef.current = "Send failed";
            toast.error(errorRef.current);
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

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Users, text: "Managed your Dashboard here." },
    { id: "sessions", label: "Sessions", icon: Clock, text: "Manage your sesions." },
    { id: "students", label: "Students", icon: User, text: "Manage or add students here." },
    { id: "settings", label: "Settings", icon: SettingsIcon, text: "Modify Settings" },
  ];
  const curText = sidebarItems.find((tab) => tab.id === activeTab);

  const [isCurrentClosed, setIsCurrentClosed] = useState(false);
  const [isCurrentActive, setIsCurrentActive] = useState(false);

  // Fetch current session ONLY in effect
  useEffect(() => {
    if (!id) return;
    getCurrentSession(id)
      .then((response) => {
        setCurrentSession(response.data.sessionID);
        setIsCurrentActive(response.data.active);
        setIsCurrentClosed(response.data.closed);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [id]);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmission = () => {
    const payload = {
      status: batchStatus,
      optionalNotes: batchRemarks,
      recordedBy: localStorage["username"],
    };
    batchMark(payload, id)
      .then(() => {
        setShowBatchDialog(false);
        setIsSubmitted(true);
        toast.success("Successfully updated!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update.");
      });
  };

  const handleActive = () => {
    if (!id) return;
    activateCourse(id)
      .then(() => {
        toast.success("Successfully set to Active");
        setIsCurrentActive(true);
      })
      .catch(() => {
        toast.error("Unable to set active.");
      });
  };

  const navigate = useNavigate();
  const [loading, isLoading] = useState(false);

  const closeSession = () => {
    isLoading(true)
    if (!id) return;
    closeCourse(id)
      .then(() => {
        toast.success("Successfully set to Closed");
        getCurrentSession(id)
          .then((response) => {
            setCurrentSession(response.data.sessionID);
            setIsCurrentActive(response.data.active);
            setIsCurrentClosed(response.data.closed);
          })
          .catch((err) => {
            console.error(err);
          });
        navigate(`/session_start/${id}`);
      })
      .catch(() => {
        toast.error("Unable to set to close.");
      });
  };

  const exportPDF = () => {
    pdfExport(id)
      .then(() => {
        setConfirmationDialog(false);
        toast.success("Sent PDF Successfully and emailed.");
      })
      .catch((error) => {
        console.error(error);
        setConfirmationDialog(false);
        toast.error("PDF did not manage to send and emailed.");
      });
  };

  const exportCSV = () => {
    csvExport(id)
      .then(() => {
        setConfirmationDialog(false);
        toast.success("Sent CSV Successfully and emailed.");
      })
      .catch((error) => {
        console.error(error);
        setConfirmationDialog(false);
        toast.error("CSV did not manage to send and emailed.");
      });
  };

  return (
    <div className="flex bg-slate-950 text-white overflow-x-hidden">
      <div className="flex-1 min-w-0">
        <div className="w-full min-w-0">
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

              {isCurrentClosed ? (
                <div className="grid grid-cols-1 gap-3">
                  <ImportAttendanceButton sessionId={id ?? ""} />
                  <Button
                    onClick={() => setConfirmationDialog(true)}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 
                    font-medium px-2 py-2 backdrop-blur-sm shadow-sm transition-all rounded-2xl"
                  >
                    <Upload size={18} className="mr-2" />
                    Export
                  </Button>
                </div>
              ) : !isCurrentActive ? (
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={handleActive}
                    className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-400/40 
                    font-semibold rounded-2xl px-4 py-5 transition-all"
                  >
                    <SettingsIcon size={18} className="mr-2" />
                    Set to Active
                  </Button>
                </div>
              ) : (
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
                    onClick={closeSession}
                    disabled={loading}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold px-4 py-5 border border-red-400/40 backdrop-blur-sm 
                    shadow-sm transition-all rounded-2xl"
                  >
                    <Highlighter size={18} className="mr-2" />
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Closing...
                      </>
                    ) : (
                      "Close Session"
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
          </Card>

          <div className="">
            <Live
              sessionActive={sessionActive}
              currentSessionId={currentSessionId}
              recognitionMode={recognitionMode}
              running={running}
              isSubmitted={isSubmitted}
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
              uploadCanvasRef={uploadCanvasRef}
              WIDTH={WIDTH}
              HEIGHT={HEIGHT}
              setRunning={setRunning}
              setShowManualEntry={setShowManualEntry}
              stopSession={stopSession}
              handleFileUpload={handleFileUpload}
              handleManualEntry={() => { }}
              updateRecord={updateRecord}
              setEditingRecord={setEditingRecord}
              fps={fps}
              recvFps={recvFps}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Batch Mark Dialog */}
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

      {/* Camera Picker */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white rounded-2xl shadow-xl">
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

      {/* Export Dialog */}
      <Dialog open={confirmationDialog} onOpenChange={setConfirmationDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-slate-300">
              Choose your method of exporting.
            </DialogTitle>
          </DialogHeader>

          <div className="flex space-x-4">
            <div className="w-[50%]">
              <Button
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 rounded-2xl px-4 py-5 backdrop-blur-sm shadow-sm transition-all flex items-center justify-center gap-2 w-full"
                onClick={exportPDF}
              >
                <File className="w-4 h-4" />
                PDF
              </Button>
            </div>
            <div className="w-[50%]">
              <Button
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-2xl px-4 py-5 backdrop-blur-sm shadow-sm transition-all flex items-center justify-center gap-2"
                onClick={exportCSV}
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
