"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Search } from "lucide-react"
import type { SessionProps } from "../components/utils/dashboard-types"
//Students will be the total students in the current repository.
const dummyData = [
  {
    studentName: "Nicholas Soh",
    studentID: "01455728",
    studentEmail: "nicholassoh.2024@computing.smu.edu.sg",
    studentPhone: "96792445",
    studentImage:
      "https://as2.ftcdn.net/jpg/02/90/27/39/1000_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg",
  },
  {
    studentName: "John Tan",
    studentID: "01455729",
    studentEmail: "johntan.2024@computing.smu.edu.sg",
    studentPhone: "91234567",
    studentImage:
      "https://as2.ftcdn.net/jpg/02/90/27/39/1000_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg",
  },
  {
    studentName: "Rachel Lee",
    studentID: "01455730",
    studentEmail: "rachel.lee@computing.smu.edu.sg",
    studentPhone: "96543210",
    studentImage:
      "https://as2.ftcdn.net/jpg/02/90/27/39/1000_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg",
  },
]

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = dummyData.filter((s) =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Student Directory
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage all students registered in the system
                </p>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Plus size={18} className="mr-2" />
                  Add Student
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search students by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((record) => (
                        <tr
                          key={record.studentID}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.studentName}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {record.studentID}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.studentEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.studentPhone}
                          </td>
                          <td className="px-6 py-4">
                            <img
                              src={record.studentImage}
                              alt={record.studentName}
                              className="w-[100px] h-[100px] rounded-lg object-cover border"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}