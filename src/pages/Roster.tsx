"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Search, Eye, Download, Upload, X, UserPlus, Trash2, Check, ChevronsUpDown } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { RosterDB } from '../components/utils/types';
import { getDropdownCourse } from "@/components/api/backend-methods/Courses"
import { getStudentEnrollmentByMod } from "@/components/api/backend-methods/StudentEnrollment"
import { addStudentToSession, getAllRoster } from "@/components/api/backend-methods/StudentSession"
import { toast } from "sonner"

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
  const [currentSelected, setCurrentSelected] = useState("")
  const [currentEnrolledStudents, setCurrentEnrolledStudents] = useState<any>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  useEffect(() => {
    getAllRoster().then((response) => {
      setRosters(response.data)
    }).catch((err) => {
      console.log(err)
    })
  }, [currentSelected])

  // const filtered = rosters.filter((r) =>
  //   [r.name, r.course, r.courseCode].some((f) =>
  //     f.toLowerCase().includes(searchTerm.toLowerCase())
  //   )
  // )
  const [allCourses, setAllCourses] = useState<any>([])
  useEffect(() => {
    getDropdownCourse().then((response) => {
      let responseData = response.data;
      let currentCodes = responseData.map((data: any) => {
        return data.courseCode;
      })
      setAllCourses(currentCodes)
    })
  }, [])

  const createRoster = () => {
    //Extract CS102, Selected students. 
    //Get all sessions corresponding to CS102 from the Sessions table.
    //From there, we will create for each Session of CS102, I will add the student_id, session_id, and enrollmentdate is now.
    console.log("🧠 Selected Course:", currentSelected);
    console.log("👩‍🎓 Selected Students:", selectedStudents);

    // You now have both values
    const courseCode = currentSelected;
    const studentIds = selectedStudents;

    // Example: print all pairs
    studentIds.forEach((studentId) => {
      console.log(`Student ${studentId} -> Course ${courseCode}`);
    });

    addStudentToSession(courseCode, studentIds).then((response) => {
      console.log(response)
      setShowCreate(false)
      toast.success('Successfully created a roster');
    }).catch((err) => {
      console.log(err)
      toast.error('Something went wrong.');
    })

  }

  const deleteRoster = (id: string) =>
    setRosters((prev) => prev.filter((r) => r.id !== id))


  useEffect(() => {
    if (currentSelected != "") {
      getStudentEnrollmentByMod(currentSelected).then((response) => {
        setCurrentEnrolledStudents(response.data)
      }).catch((error) => {
        console.log(error)
      })
    }
  }, [currentSelected])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-0 w-[100%]">
      {/* Floating Header */}
      <Card className="w-[95%] mx-auto mb-12 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl shadow-xl transition-all">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-2xl font-semibold text-white">Rosters</CardTitle>
            <CardDescription className="text-slate-400">
              Rosters for modules here.
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
              className="pl-10 bg-slate-950/60 border-slate-800/60 text-slate-200 rounded-2xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roster Grid */}
      <div className="w-[95%] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {rosters.map((r) => (
          <Card
            key={r.id}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] transition-all duration-300"
          >
            <CardContent className="px-6 py-2 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{r.courseName}</h3>
                <p className="text-slate-400 text-sm">{r.courseDesc}</p>
                <p className="text-slate-500 text-xs">{r.courseCode}</p>
              </div>

              <div className="space-y-1 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Students</span>
                  <span className="text-slate-200">{r.students.length}</span>
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

        {rosters.length === 0 && (
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
            <Label>Course Code</Label>
            <Select onValueChange={(value) => setCurrentSelected(value)}>
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue placeholder="Course Codes" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {allCourses.map((courseCode: any) => (
                  <SelectItem key={courseCode} className="rounded-2xl" value={courseCode}>
                    {courseCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ✅ Replaced student selector */}
            <Label>Students Enrolled in Selected Course</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between rounded-2xl bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/70"
                >
                  {selectedStudents.length > 0
                    ? `${selectedStudents.length} selected`
                    : "Select students..."}
                  <ChevronsUpDown className="opacity-50" size={16} />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[350px] p-0 rounded-2xl border-slate-700 bg-slate-900/95 text-slate-200">
                <Command className="rounded-2xl">
                  <CommandInput placeholder="Search students..." />
                  <CommandList className="rounded-2xl">
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandGroup>
                      {currentEnrolledStudents.map((student: any) => {
                        const id = student.id.studentId
                        const isSelected = selectedStudents.includes(id)
                        return (
                          <CommandItem
                            key={id}
                            onSelect={() => {
                              setSelectedStudents((prev) =>
                                prev.includes(id)
                                  ? prev.filter((s) => s !== id)
                                  : [...prev, id]
                              )
                            }}
                            className={cn(
                              "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors",
                              isSelected
                                ? "bg-green-600/20 text-green-300 hover:bg-green-600/25"
                                : "hover:bg-slate-800/60"
                            )}
                          >
                            <span>{id}</span>
                            {isSelected && <Check className="text-green-400" size={16} />}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="mt-3 space-y-2">
            <Label>Selected Students:</Label>
            {selectedStudents.length > 0 ? (
              <ul className="list-disc ml-5 text-sm text-slate-300">
                {selectedStudents.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No students added yet.</p>
            )}
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
            <DialogTitle>{viewRoster?.courseName}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {viewRoster?.courseDesc}
              
            </DialogDescription>
            <DialogDescription>
              Module Code: {viewRoster?.courseCode}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto mt-4 max-h-[60vh]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-800/60 text-slate-300 uppercase text-xs">
                <tr>
                  {["ID", "Name", "Email", "Enrolled"].map((h) => (
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