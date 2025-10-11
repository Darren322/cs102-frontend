"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Filter,
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Settings,
  StickyNote,
  Clock,
  CalendarIcon
} from "lucide-react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar";
import type { Session } from "../components/utils/types" // adjust path if needed
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createSessions } from "../components/api/backend-methods/Sessions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
// Types for sessions and rosters
type Roster = {
  id: string
  name: string
  course: string
  semester: string
  students: Student[]
  createdAt: number
}

type Student = {
  id: string
  name: string
  email: string
  studentId: string
}

type SessionRecord = {
  id: string
  name: string
  rosterId: string
  rosterName: string
  course: string
  createdAt: number
  status: "draft" | "active" | "completed"
  attendanceCount: number
  totalStudents: number
  duration?: number
  recognitionMode?: "live" | "upload"
}



export default function SessionsPage() {
  // State management
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [location, setLocation] = useState("")
  const [sessionName, setSessionName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "completed">("all")
  const [sessionsByUser, setSessionByUser] = useState<any[]>([])

  const [endDate, setEndDate] = useState<Date>()
  const [startDate, setStartDate] = useState<Date>()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  // Initialize data
  useEffect(() => {
    // Import API methods dynamically to avoid build issues
    const loadSessions = async () => {
      try {
        const { getSessionByCreator } = await import("../components/api/backend-methods/Sessions")
        const response = await getSessionByCreator()
        console.log(response)
        setSessionByUser(response.data)
      } catch (error) {
        console.error(error)
      }
    }

    if (typeof window !== "undefined" && localStorage["username"]) {
      loadSessions()
    }
  }, [])

  const handleCreateSession = async () => {
    const formattedEndDate = (endDate as Date).toISOString().split("T")[0];
    const formattedStartDate = (startDate as Date).toISOString().split("T")[0];

    const newSession: Session = {
      courseName: sessionName.trim(),
      startTime: startTime,
      endTime: endTime,
      date: formattedStartDate,
      lastDate: formattedEndDate,
      location: location.trim(),
    }
    createSessions(newSession).then((response) => {
      console.log(response)
      setShowCreateSession(false)
      toast.success('Created Sessions')
    }).catch((error) => {
      console.error(error)
      toast.error('Unale to create session')
    })

  };

  const activateSession = async (sessionId: string) => {
    try {
      const { activateCourse, getSessionByCreator } = await import("../components/api/backend-methods/Sessions")
      const response = await activateCourse(sessionId)
      console.log(response)

      const r = await getSessionByCreator()
      setSessionByUser(r.data)
      console.log("success")
    } catch (error) {
      console.log(error)
    }
  }

  const closeSession = async (sessionId: string) => {
    try {
      const { closeCourse, getSessionByCreator } = await import("../components/api/backend-methods/Sessions")
      const response = await closeCourse(sessionId)
      console.log(response)

      const r = await getSessionByCreator()
      setSessionByUser(r.data)
      console.log("success")
    } catch (error) {
      console.log(error)
    }
  }

  // Helper functions
  const formatTime = (time: string) => {
    // Add your time formatting logic here
    return time
  }
  const navigate = useNavigate();

  const stringFormatter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }



  return (
    <div className="flex h-screen bg-slate-950 dark">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-8 pb-0">
            <Card className="mb-6 bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
              <CardHeader className="px-6 py-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl tracking-tight">Sessions</CardTitle>
                    <CardDescription className="mt-1 text-muted-foreground">
                      Manage Sessions here.
                    </CardDescription>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => setShowCreateSession(true)}
                        className="
    rounded-full h-11 px-6 font-medium
    bg-blue-500/20 text-blue-300 border border-blue-500/30
    backdrop-blur-md transition-all
    hover:bg-blue-500/30 hover:text-blue-100 hover:border-blue-400/50
    shadow-sm hover:shadow-blue-500/20
  "
                      >
                        <Plus size={18} className="mr-2" />
                        Create New Session
                      </Button>
                    </div>

                  </div>


                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="px-8 pb-8 space-y-6">

            <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search sessions by name, course, or roster..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50  border-slate-700/50 text-white placeholder:text-slate-500 rounded-2xl h-11 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                      <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 text-white rounded-2xl h-11">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Created</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {
                sessionsByUser?.map((session) => {
                  console.log(session)
                  return (
                    <Card
                      key={session.sessionID}
                      className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/50 rounded-2xl"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-white mb-1 font-semibold">
                              {session.course?.courseName}
                            </CardTitle>
                            <p className="text-sm text-slate-400 font-medium">{session.course?.courseCode}</p>
                          </div>
                          <Badge
                            variant={
                              session.status === "ACTIVE"
                                ? "default"
                                : session.status === "CLOSED"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={`rounded-full px-3 py-1 font-medium ${session.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                              : session.status === "CLOSED"
                                ? "bg-red-500/10 text-red-200 hover:bg-red-500/20 border border-red-500/20"
                                : "bg-slate-700/50 text-slate-300 border border-slate-600/50"
                              }`}
                          >
                            {stringFormatter(session.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2.5 rounded-xl p-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Date of Session:</span>
                            <span className="text-white font-medium">{new Date(session.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Start Time:</span>
                            <span className="text-white font-medium">{formatTime(session.startTime)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">End Time:</span>
                            <span className="text-white font-medium">{formatTime(session.endTime)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 justify-end">
                          {session.closed && !session.active ? (
                            // --- CLOSED ---
                            <Button
                              onClick={() => navigate(`/session_start/${session.sessionID}`)}
                              className="
        rounded-full h-10 px-5 font-medium
        bg-blue-500/20 text-blue-300 border border-blue-500/30
        backdrop-blur-md transition-all
        hover:bg-blue-500/30 hover:text-blue-100 hover:border-blue-400/50
        shadow-sm hover:shadow-blue-500/20
      "
                            >
                              View Details
                            </Button>
                          ) : session.active ? (
                            // --- ACTIVE ---
                            <>
                              <Button
                                onClick={() => closeSession(session.sessionID)}
                                className="
          rounded-full h-10 px-5 font-medium
          bg-red-500/20 text-red-300 border border-red-500/30
          backdrop-blur-md transition-all
          hover:bg-red-500/30 hover:text-red-100 hover:border-red-400/50
          shadow-sm hover:shadow-red-500/20
        "
                              >
                                Close Session
                              </Button>
                              <Button
                                onClick={() => navigate(`/session_start/${session.sessionID}`)}
                                className="
          rounded-full h-10 px-5 font-medium
          bg-green-500/20 text-green-300 border border-green-500/30
          backdrop-blur-md transition-all
          hover:bg-green-500/30 hover:text-green-100 hover:border-green-400/50
          shadow-sm hover:shadow-green-500/20
        "
                              >
                                Take Attendance
                              </Button>
                            </>
                          ) : (
                            // --- INACTIVE (not closed yet) ---
                            <Button
                              onClick={() => activateSession(session.sessionID)}
                              className="
        rounded-full h-10 px-5 font-medium
        bg-green-500/20 text-green-300 border border-green-500/30
        backdrop-blur-md transition-all
        hover:bg-green-500/30 hover:text-green-100 hover:border-green-400/50
        shadow-sm hover:shadow-green-500/20
      "
                            >
                              Set Active
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              }

            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Create New Session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="session-name" className="text-slate-300 font-medium">
                Course Code
              </Label>
              <Input
                id="session-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., CS101 - Lecture 5"
                className="mt-2 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-2xl h-11 focus:ring-2 focus:ring-blue-500/20"
              />


              <>


                <div className="mt-4">
                  <Label htmlFor="session-location" className="text-slate-300 font-medium">
                    Location
                  </Label>
                  <Input
                    id="session-location"
                    type="text"
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., SCIS 2 SR 4-1"
                    className="mt-2 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-2xl h-11 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>


                {/* === Date pickers === */}
                <div className="flex justify-between gap-6 mt-4">
                  {/* Start Date */}
                  <div className="flex flex-col flex-1">
                    <Label className="text-slate-300 font-medium">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "mt-2 h-11 w-full justify-start text-left font-normal rounded-2xl bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50",
                            !startDate && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          {startDate ? format(startDate, "PPP") : "Select start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                  <div className="flex flex-col flex-1">
                    <Label className="text-slate-300 font-medium">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "mt-2 h-11 w-full justify-start text-left font-normal rounded-2xl bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50",
                            !endDate && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          {endDate ? format(endDate, "PPP") : "Select end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>


                {/* === Time pickers === */}
                <div className="flex justify-between gap-6 mt-1">
                  {/* Start Time */}
                  <div className="flex flex-col flex-1">
                    <Label className="text-slate-300 font-medium mt-5">Start Time</Label>
                    <div className="relative mt-2">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-700/50 text-white rounded-2xl h-11 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="flex flex-col flex-1">
                    <Label className="text-slate-300 font-medium mt-5">End Time</Label>
                    <div className="relative mt-2">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-700/50 text-white rounded-2xl h-11 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </>
            </div>


            {/* Comment out first */}
            {/* <div>
              <Label htmlFor="roster-select" className="text-slate-300 font-medium">
                Course Roster
              </Label>
              <Select value={selectedRoster} onValueChange={setSelectedRoster}>
                <SelectTrigger
                  id="roster-select"
                  className="mt-2 bg-slate-800/50 border-slate-700/50 text-white rounded-xl h-11"
                >
                  <SelectValue placeholder="Select a roster..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                  {rosters.map((roster) => (
                    <SelectItem key={roster.id} value={roster.id}>
                      {roster.name} ({roster.course}) - {roster.students.length} students
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* {selectedRoster && (
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Selected Roster Students:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {rosters
                      .find((r) => r.id === selectedRoster)
                      ?.students.map((student) => (
                        <div key={student.id} className="text-xs text-slate-400">
                          {student.name} ({student.studentId})
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )} */}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateSession(false)}
              className="
    rounded-full h-10 px-6 font-medium
    bg-slate-700/30 text-slate-300 border border-slate-600/40
    backdrop-blur-md transition-all
    hover:bg-slate-700/40 hover:text-white hover:border-slate-500/40
  "
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}

              className="rounded-2xl h-10 px-6 font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
