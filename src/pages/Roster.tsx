"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Search, Eye, Download, Upload, X, UserPlus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type Student = {
  id: string
  name: string
  email: string
  studentId: string
  enrollmentDate: string
  status: "active" | "inactive"
}

type Roster = {
  id: string
  name: string
  course: string
  courseCode: string
  semester: string
  students: Student[]
  createdAt: number
  lastModified: number
  instructor: string
}

export default function RostersPage() {
  const [rosters, setRosters] = useState<Roster[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [viewRoster, setViewRoster] = useState<Roster | null>(null)
  const [newRoster, setNewRoster] = useState({
    name: "",
    course: "",
    courseCode: "",
    semester: "Fall 2024",
  })

  useEffect(() => {
    const mock: Roster[] = [
      {
        id: "S001",
        name: "Computer Science 101 - Morning Section",
        course: "Introduction to Computer Science",
        courseCode: "CS101",
        semester: "Fall 2024",
        instructor: "Prof. John Parker",
        createdAt: Date.now() - 86400000,
        lastModified: Date.now() - 3600000,
        students: [
          { id: "1", name: "John Doe", email: "john.doe@student.edu", studentId: "STUDENT_001", enrollmentDate: "2024-08-15", status: "active" },
          { id: "2", name: "Jane Smith", email: "jane.smith@student.edu", studentId: "STUDENT_002", enrollmentDate: "2024-08-15", status: "active" },
          { id: "3", name: "Bob Johnson", email: "bob.johnson@student.edu", studentId: "STUDENT_003", enrollmentDate: "2024-08-15", status: "active" },
        ],
      },
      {
        id: "S002",
        name: "Data Structures & Algorithms",
        course: "Advanced Programming Concepts",
        courseCode: "CS201",
        semester: "Fall 2024",
        instructor: "Prof. John Parker",
        createdAt: Date.now() - 172800000,
        lastModified: Date.now() - 7200000,
        students: [
          { id: "6", name: "David Lee", email: "david.lee@student.edu", studentId: "STUDENT_006", enrollmentDate: "2024-08-15", status: "active" },
          { id: "7", name: "Emma Davis", email: "emma.davis@student.edu", studentId: "STUDENT_007", enrollmentDate: "2024-08-15", status: "active" },
        ],
      },
    ]
    setRosters(mock)
  }, [])

  const filtered = rosters.filter((r) =>
    [r.name, r.course, r.courseCode].some((f) =>
      f.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const createRoster = () => {
    if (!newRoster.name || !newRoster.course || !newRoster.courseCode) return
    const roster: Roster = {
      id: `roster_${Date.now()}`,
      name: newRoster.name,
      course: newRoster.course,
      courseCode: newRoster.courseCode,
      semester: newRoster.semester,
      instructor: "Prof. John Parker",
      createdAt: Date.now(),
      lastModified: Date.now(),
      students: [],
    }
    setRosters((prev) => [roster, ...prev])
    setShowCreate(false)
    setNewRoster({ name: "", course: "", courseCode: "", semester: "Fall 2024" })
  }

  const deleteRoster = (id: string) =>
    setRosters((prev) => prev.filter((r) => r.id !== id))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-0 w-[100%]">
      {/* Floating Header */}
      <Card className="w-[95%] mx-auto mb-12 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl shadow-xl transition-all">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-2xl font-semibold text-white">Attendance Records</CardTitle>
            <CardDescription className="text-slate-400">
              Manage records for your past sessions and rosters.
            </CardDescription>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-300 transition-all"
            >
              <Upload size={16} className="mr-2" /> Import CSV
            </Button>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 transition-all"
            >
              <Plus size={16} className="mr-2" /> New Roster
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search Bar */}
      <Card className="w-[95%] mx-auto mb-10 rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rosters by name, course, or code..."
              className="pl-10 bg-slate-950/60 border-slate-800/60 text-slate-200 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roster Grid */}
      <div className="w-[95%] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map((r) => (
          <Card
            key={r.id}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] transition-all duration-300"
          >
            <CardContent className="p-6 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{r.name}</h3>
                <p className="text-slate-400 text-sm">{r.course}</p>
                <p className="text-slate-500 text-xs">{r.courseCode} — {r.semester}</p>
              </div>

              <div className="space-y-1 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Students</span>
                  <span className="text-slate-200">{r.students.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modified</span>
                  <span>{new Date(r.lastModified).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setViewRoster(r)}
                  className="flex-1 bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
                >
                  <Eye size={16} className="mr-1" /> View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteRoster(r.id)}
                  className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-20">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No rosters found</p>
          </div>
        )}
      </div>

      {/* Create Roster Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900/95 border border-slate-800/60 backdrop-blur-xl text-slate-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Roster</DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill in the details for your new roster.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {["name", "course", "courseCode"].map((field) => (
              <div key={field}>
                <Label className="capitalize">{field}</Label>
                <Input
                  value={(newRoster as any)[field]}
                  onChange={(e) =>
                    setNewRoster((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  placeholder={`Enter ${field}`}
                  className="bg-slate-950/50 border-slate-800/60 text-slate-200 mt-1"
                />
              </div>
            ))}

            <div>
              <Label>Semester</Label>
              <select
                value={newRoster.semester}
                onChange={(e) =>
                  setNewRoster((prev) => ({ ...prev, semester: e.target.value }))
                }
                className="w-full rounded-md bg-slate-950/50 border border-slate-800/60 px-3 py-2 mt-1 text-slate-200"
              >
                {["Fall 2024", "Spring 2024", "Summer 2024", "Winter 2024"].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="border-slate-700 text-slate-400 hover:bg-slate-800/60"
            >
              Cancel
            </Button>
            <Button
              onClick={createRoster}
              disabled={!newRoster.name || !newRoster.course || !newRoster.courseCode}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Roster Dialog */}
      <Dialog open={!!viewRoster} onOpenChange={() => setViewRoster(null)}>
        <DialogContent className="max-w-4xl bg-slate-900/95 border border-slate-800/60 backdrop-blur-xl text-slate-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{viewRoster?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {viewRoster?.course} ({viewRoster?.courseCode})
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto mt-4 max-h-[60vh]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-800/60 text-slate-300 uppercase text-xs">
                <tr>
                  {["ID", "Name", "Email", "Enrolled", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {viewRoster?.students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2 text-slate-300">{s.studentId}</td>
                    <td className="px-4 py-2 text-slate-200 font-medium">{s.name}</td>
                    <td className="px-4 py-2 text-slate-400">{s.email}</td>
                    <td className="px-4 py-2 text-slate-400">{s.enrollmentDate}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          s.status === "active"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/10 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}