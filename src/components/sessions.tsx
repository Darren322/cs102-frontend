"use client"

import type { SessionProps } from "../components/utils/dashboard-types"

export function Session({
    
}: SessionProps) {
    let dummySession = [
        { cName: "CS102", dateCourse: "05/10/2025", rosterDet: ['Usr1', 'Usr2'], startTime: "08:00", endTime: "11:00", location: "SOE/SCIS 2 SR 2-4", status: "Pending" },
        { cName: "CS102", dateCourse: "05/10/2025", rosterDet: ['Usr1', 'Usr2'], startTime: "08:00", endTime: "11:00", location: "SOE/SCIS 2 SR 2-4", status: "Active" },
        { cName: "CS102", dateCourse: "05/10/2025", rosterDet: ['Usr1', 'Usr2'], startTime: "08:00", endTime: "11:00", location: "SOE/SCIS 2 SR 2-4", status: "Pending" }

    ];
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Sessions belonging to you</h3>
                <p className="text-sm text-gray-600">
                    All Sessions you have created.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Course Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date of Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Roster Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Start Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                End Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Get Report
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {dummySession.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    No session records yet
                                </td>
                            </tr>
                        ) : (
                            dummySession.map((record) => (
                                <tr key={record.cName} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.cName}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(record.dateCourse).toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        PLACEHLDER
                                    </td>
                                    {/* <td className="px-6 py-4 whitespace-nowrap">
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
                  </td> */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {record.startTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {record.endTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {record.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">

                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === "Pending"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-green-100 text-green-800"
                                                }`}
                                        >
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get Report</button>
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