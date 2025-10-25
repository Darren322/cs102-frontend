"use client"

import { useEffect, useState } from "react"
import {  Search } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { getAllStudent } from "./api/backend-methods/Student"


export default function Students() {
  const [searchTerm, setSearchTerm] = useState("")
  const [allStudents, setAllStudents] = useState<any>([])

  useEffect(() => {
    getAllStudent()
      .then((response) => {
        setAllStudents(response.data)
        console.log("Success")
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  console.log(allStudents)

  const filteredStudents = allStudents.filter((s: any) =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">


      <Card className="w-full mt-[-25px] mx-auto mb-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl shadow-xl transition-all">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-2xl font-semibold text-white">Students</CardTitle>
            <CardDescription className="text-slate-400 mt-[5px]">
              Students in Directory
            </CardDescription>
          </div>

        </CardHeader>
      </Card>

      {/* Search Bar */}
      <Card className="w-full mb-10 rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name or ID..."
              className="pl-10 bg-slate-950/60 border-slate-800/60 text-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="w-full rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            All Registered Students
          </CardTitle>
          <CardDescription className="text-slate-400">
            View and manage all student profiles
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader className="bg-slate-800/70 text-slate-300 uppercase text-xs">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-slate-500 py-8"
                  >
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((record: any) => (
                  <TableRow
                    key={record.username}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <TableCell className="text-slate-200">
                      {record.username}
                    </TableCell>
                    <TableCell className="text-slate-300 font-medium">
                      {record.studentId}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {record.email}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {record.phone}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}