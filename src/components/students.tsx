"use client"

import type { SessionProps } from "../components/utils/dashboard-types"

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
            {attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No students added into the system yet.
                </td>
              </tr>
            ) : (
              attendanceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.sessionId.split("_")[1]}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.studentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          record.confidence >= 90
                            ? "bg-green-500"
                            : record.confidence >= 70
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      {record.confidence.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRecord === record.id ? (
                      <select
                        value={record.markingType}
                        onChange={(e) =>
                          updateRecord(record.id, "markingType", e.target.value)
                        }
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.markingType === "automatic"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {record.markingType}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRecord === record.id ? (
                      <select
                        value={record.status}
                        onChange={(e) =>
                          updateRecord(record.id, "status", e.target.value)
                        }
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === "present"
                            ? "bg-green-100 text-green-800"
                            : record.status === "late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingRecord === record.id ? (
                      <input
                        type="text"
                        value={record.remarks}
                        onChange={(e) =>
                          updateRecord(record.id, "remarks", e.target.value)
                        }
                        className="text-xs border rounded px-2 py-1 w-full"
                        placeholder="Add remarks..."
                      />
                    ) : (
                      record.remarks || "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        setEditingRecord(
                          editingRecord === record.id ? null : record.id
                        )
                      }
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {editingRecord === record.id ? "Save" : "Edit"}
                    </button>
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