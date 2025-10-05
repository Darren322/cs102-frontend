export type LiveProps = {
  sessionActive: boolean
  currentSessionId: string
  recognitionMode: string
  running: boolean
  err?: string

  presentList: { name: string; since: string }[]
  attendanceRecords: {
    id: string
    sessionId: string
    studentId: string
    timestamp: string
    confidence: number
    markingType: "automatic" | "manual"
    status: string
    remarks?: string
  }[]

  editingRecord: string | null
  showManualEntry: boolean
  manualStudentId: string
  manualRemarks: string

  videoRef: React.RefObject<HTMLVideoElement>
  serverImgRef: React.RefObject<HTMLImageElement>
  captureRef: React.RefObject<HTMLCanvasElement>
  fileInputRef: React.RefObject<HTMLInputElement>

  WIDTH: number
  HEIGHT: number

  setRunning: (val: boolean) => void
  setShowManualEntry: (val: boolean) => void
  stopSession: () => void
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleManualEntry: () => void
  updateRecord: (id: string, field: string, value: any) => void
  setEditingRecord: (id: string | null) => void
}

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
