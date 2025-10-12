export type LiveProps = {
  sessionActive: boolean;
  currentSessionId: string;
  recognitionMode: "live" | "upload" | null;
  running: boolean;
  isSubmitted:boolean,
  err: string;
  presentList: Array<{ name: string; since: number }>;
  attendanceRecords: any[];
  editingRecord: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  serverImgRef: React.RefObject<HTMLImageElement>;
  captureRef: React.RefObject<HTMLCanvasElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  WIDTH: number;
  HEIGHT: number;
  setRunning: (v: boolean) => void;
  stopSession: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualEntry: () => void;
  updateRecord: (id: string, field: any, value: any) => void;
  setEditingRecord: (id: string | null) => void;

  // NEW:
  fps?: number;      // outgoing FPS (camera → backend)
  recvFps?: number;  // incoming FPS (backend → client), optional
};


export type AttendanceRecord = {
  id: string
  sessionId: string
  studentId: string
  timestamp: string
  confidence: number
  markingType: "automatic" | "manual"
  status: string
  remarks?: string
}

export type SessionProps = {
  attendanceRecords: AttendanceRecord[]
  editingRecord: string | null
  updateRecord: (id: string, field: string, value: any) => void
  setEditingRecord: (id: string | null) => void
}
