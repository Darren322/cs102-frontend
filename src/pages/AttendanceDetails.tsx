import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Download, Search, ChevronDown, ChevronUp } from "lucide-react";
import { getAttendanceRecord } from "../components/api/backend-methods/AttendanceRecord";
import { useParams } from "react-router-dom";





export default function AttendanceDetails() {
    const [currentRecord, setCurrentRecord] = useState<any[]>([])
    const [loading, setLoading] = useState(true);
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const currentParams = useParams().id;

    const handleFieldChange = (id: string, field: string, value: string) => {
        setCurrentRecord((prev) =>
            prev.map((rec) =>
                rec.studentId === id ? { ...rec, [field]: value } : rec
            )
        );
    };


    useEffect(() => {

        getAttendanceRecord(currentParams).then((response) => {
            setCurrentRecord(response.data)
            setLoading(false)
            console.log(response.data)
        }).catch((err) => {
            console.error(err)
        })
    }, [currentParams]);




    if (loading) {
        return (
            <div className="flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading attendance records...</p>
                </div>
            </div>
        );
    }

    if (!currentRecord) {
        return (
            <div className="flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Record Not Found</h3>
                    <p className="text-gray-600 mb-4">The attendance record you're looking for doesn't exist.</p>
                    <button className="text-blue-600 hover:text-blue-700">Back to Records</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50">
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <div className="bg-white border-b border-gray-200 px-6 py-[34px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
                                <p className="text-gray-600 mt-1">Current Session ID: {currentParams}</p>
                            </div>
                            <div>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Generate Summary
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Student ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Confidence Threshold
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Method
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Optional Notes
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Timestamp
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Edit details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentRecord.map((session) => {
                                            let newDate = new Date(session.timestamp)
                                            let currentDate = newDate.toDateString();
                                            let formatter = new Intl.DateTimeFormat("en-SG", {
                                                hour: "numeric",
                                                minute: '2-digit',
                                                hour12: true,
                                            });
                                            return (
                                                <tr key={session.studentId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0">
                                                        {session.studentId}
                                                    </td>

                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0">
                                                        {session.confidenceThreshold}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {editingRow === session.studentId ? (
                                                            <select
                                                                value={session.method}
                                                                onChange={(e) =>
                                                                    handleFieldChange(session.studentId, "method", e.target.value)
                                                                }
                                                                className="border rounded px-2 py-1"
                                                            >
                                                                <option value="AUTO">Auto</option>
                                                                <option value="MANUAL">Manual</option>
                                                                <option value="VERIFY">Verify</option>
                                                            </select>
                                                        ) : (
                                                            session.method.charAt(0) + session.method.slice(1).toLowerCase()
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {editingRow === session.studentId ? (
                                                            <select
                                                                value={session.status}
                                                                onChange={(e) =>
                                                                    handleFieldChange(session.studentId, "status", e.target.value)
                                                                }
                                                                className="border rounded px-2 py-1"
                                                            >
                                                                <option value="PRESENT">Present</option>
                                                                <option value="LATE">Late</option>
                                                                <option value="ABSENT">Absent</option>
                                                            </select>
                                                        ) : (
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs font-medium ${session.status === "PRESENT"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : session.status === "LATE"
                                                                        ? "bg-red-100 text-red-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                                    }`}
                                                            >
                                                                {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                                                            </span>
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {editingRow === session.studentId ? (
                                                            <input
                                                                type="text"
                                                                value={session.optionalNotes || ""}
                                                                onChange={(e) =>
                                                                    handleFieldChange(session.studentId, "optionalNotes", e.target.value)
                                                                }
                                                                className="border rounded px-2 py-1 w-full"
                                                                placeholder="Add a note..."
                                                            />
                                                        ) : (
                                                            session.optionalNotes || "—"
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0">
                                                        {currentDate}  {formatter.format(newDate)}
                                                    </td>

                                                    <td className="px-6 py-4 align-center">
                                                        <button
                                                            className="text-white hover:underline bg-blue-600 rounded px-4 py-2"
                                                            onClick={() =>
                                                                setEditingRow(editingRow === session.studentId ? null : session.studentId)
                                                            }
                                                        >
                                                            {editingRow === session.studentId ? "Save" : "Edit"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* {filteredStudents.map((studentName) => {
                      const studentAttendances = currentRecord.sessions.map(session =>
                        session.attendance.find(a => a.studentName === studentName)
                      );
                      const presentCount = studentAttendances.filter(a => a?.status === 'present' || a?.status === 'late').length;
                      const attendanceRate = ((presentCount / currentRecord.sessions.length) * 100).toFixed(0);
                      

                    })} */}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}