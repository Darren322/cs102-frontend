"use client"

import type { SessionProps } from "../components/utils/dashboard-types"
const dummyData =[
  {studentName: "Nicholas Soh", studentID:'01455728', studentEmail: 'nicholassoh.2024@computing.smu.edu.sg', studentPhone: '96792445', studentImage: 'https://as2.ftcdn.net/jpg/02/90/27/39/1000_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg'},
  {studentName: "Nicholas Soh", studentID:'01455728', studentEmail: 'nicholassoh.2024@computing.smu.edu.sg', studentPhone: '96792445', studentImage: 'https://as2.ftcdn.net/jpg/02/90/27/39/1000_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg'},
  {studentName: "Nicholas Soh", studentID:'01455728', studentEmail: 'nicholassoh.2024@computing.smu.edu.sg', studentPhone: '96792445', studentImage: 'https://as2.ftcdn.net/jpg/02/90/27/39/1000_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg'}
]

export function Students({
  attendanceRecords,
  editingRecord,
  updateRecord,
  setEditingRecord,
}: SessionProps) {
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Students in the system</h3>
        <p className="text-sm text-gray-600">
          All students you have created
        </p>
      </div>

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
                Student Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Image
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dummyData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No students added into the system yet.
                </td>
              </tr>
            ) : (
              dummyData.map((record) => (
                <tr key={record.studentID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.studentID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.studentEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {record.studentPhone}                      
                  </td>
                  <td className="h-[200px]">
                    <img src={record.studentImage} alt="" width={200} height={200} className="rounded-xl"/>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}