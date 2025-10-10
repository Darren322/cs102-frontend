import { useState, useEffect } from "react";
import { Camera, Upload, Plus, Calendar, Search, Filter, Eye, Trash2, MoreHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { activateCourse, closeCourse, getSessionByCreator } from "../components/api/backend-methods/Sessions";
import { formatTime, stringFormatter } from "../components/utils/stringFormatter";

//This page should show the Sessions the prof has created.
//1 Class is 1 Session. CS102 has 1 Session.

//Suitable endpoint to call here:
//Get all By creator. 
//Allow Creator to filter by Active/Etc.

//Allow user to click on button for CREATED ones. If created, then it will show set Active or something.
//If active, allows them to do recogntion (show two buttons) (sessionId/activate)
//If closed, when click on card, just go to next page. (sessionId/close)

// Types for sessions and rosters
type Roster = {
  id: string;
  name: string;
  course: string;
  semester: string;
  students: Student[];
  createdAt: number;
};

type Student = {
  id: string;
  name: string;
  email: string;
  studentId: string;
};

type SessionRecord = {
  id: string;
  name: string;
  rosterId: string;
  rosterName: string;
  course: string;
  createdAt: number;
  status: 'draft' | 'active' | 'completed';
  attendanceCount: number;
  totalStudents: number;
  duration?: number;
  recognitionMode?: 'live' | 'upload';
};

export default function SessionsPage() {
  console.log(localStorage)
  const navigate = useNavigate();

  // State management
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedRoster, setSelectedRoster] = useState<string>("");
  const [sessionName, setSessionName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all');

  // Initialize mock data
  useEffect(() => {

  }, []);

  // Create new session
  const handleCreateSession = () => {
    if (!selectedRoster || !sessionName.trim()) return;

    const roster = rosters.find(r => r.id === selectedRoster);
    if (!roster) return;

    const newSession: SessionRecord = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: sessionName.trim(),
      rosterId: selectedRoster,
      rosterName: roster.name,
      course: roster.course,
      createdAt: Date.now(),
      status: 'draft',
      attendanceCount: 0,
      totalStudents: roster.students.length
    };

    setSessions(prev => [newSession, ...prev]);
    setShowCreateSession(false);
    setSelectedRoster("");
    setSessionName("");
  };

  // Start session - navigate to SmartAttendanceSystem
  const startSession = (sessionId: string, mode: 'live' | 'upload') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const roster = rosters.find(r => r.id === session.rosterId);

    // Update session status to active
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId
          ? { ...s, status: 'active' as const, recognitionMode: mode }
          : s
      )
    );

    // Navigate to SmartAttendanceSystem with session context
    navigate('/session_start', {
      state: {
        sessionId,
        sessionName: session.name,
        course: session.course,
        rosterId: session.rosterId,
        rosterName: session.rosterName,
        recognitionMode: mode,
        students: roster?.students || []
      }
    });
  };

  const [sessionsByUser, setSessionByUser] = useState();
  useEffect(() => {
    getSessionByCreator().then((response) => {
      console.log(response)
      setSessionByUser(response.data);
    }).catch((error) => {
      console.error(error)
    })
  }, [localStorage['username']])

  const activateSession = (sessionId: string) => {
    activateCourse(sessionId).then((response) => {
      console.log(response)
      getSessionByCreator().then((r) => {
        setSessionByUser(r.data)
      }).catch((e) => {
        console.log('unable to fetch new ones.')
      })

      console.log('success')
    }).catch((error) => {
      console.log(error)
    })
  }
  const closeSession = (sessionId: string) => {
    closeCourse(sessionId).then((response) => {
      console.log(response)
      getSessionByCreator().then((r) => {
        setSessionByUser(r.data)
      }).catch((e) => {
        console.log('unable to fetch new ones.')
      })
      console.log('success')
    }).catch((error) => {
      console.log(error)
    })
  }


  console.log(sessionsByUser)
  return (
    <div className="flex h-screen bg-gray-50 w-full">


      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Sessions</h1>
                <p className="text-gray-600 mt-1">Create and manage attendance sessions based on your sessions.</p>
              </div>

              <button
                onClick={() => setShowCreateSession(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="mr-2" />
                New Session
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sessions by name, course, or roster..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Created</option>
                    <option value="active">Active</option>
                    <option value="completed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sessionsByUser?.map((session) => {
                console.log(session)


                return (
                  //this area will be our mappings (result from bern side.)
                  <div key={session.sessionID} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">{session.course.courseName}</h3>
                          <p className="text-sm text-gray-500">{session.course?.courseCode}</p>

                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                          ${session.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :

                              session.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {stringFormatter(session.status)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Date of Session:</span>
                          <span className="text-gray-900">{new Date(session.date).toLocaleDateString()}</span>
                        </div>


                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Start Time:</span>
                          <span className="text-gray-900">{formatTime(session.startTime)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">End Time:</span>
                          <span className="text-gray-900">{formatTime(session.endTime)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        {session.status === 'draft' && (
                          <>
                            <button
                              onClick={() => startSession(session.id, 'live')}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Camera size={16} className="mr-1" />
                              Live
                            </button>
                            <button
                              onClick={() => startSession(session.id, 'upload')}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Upload size={16} className="mr-1" />
                              Upload
                            </button>
                          </>
                        )}

                        <div>
                          {
                            session.active && (
                              <div className="grid grid-cols-2 gap-x-4">

                                <button
                                  onClick={() => closeSession(session.sessionID)}
                                  className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  Close Session
                                </button>
                                <button
                                  onClick={() => navigate(`/session_start/${session.sessionID}`)}
                                  className="px-3 py-2 bg-green-50 text-green-600 text-sm rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  Take Attendance
                                </button>
                              </div>



                            )
                          }
                          {
                            !session.active && (
                              <button
                                onClick={() => activateSession(session.sessionID)}
                                className="px-3 py-2 bg-green-50 text-green-600 text-sm rounded-lg hover:bg-green-100 transition-colors"
                              >
                                Set Active
                              </button>
                            )
                          }
                        </div>


                      </div>
                    </div>
                  </div>
                )
              }
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Create New Session</h3>
                <button
                  onClick={() => setShowCreateSession(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="e.g., CS101 - Lecture 5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Roster
                  </label>
                  <select
                    value={selectedRoster}
                    onChange={(e) => setSelectedRoster(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a roster...</option>
                    {rosters.map((roster) => (
                      <option key={roster.id} value={roster.id}>
                        {roster.name} ({roster.course}) - {roster.students.length} students
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoster && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Roster Students:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {rosters.find(r => r.id === selectedRoster)?.students.map((student) => (
                        <div key={student.id} className="text-xs text-gray-600 py-1">
                          {student.name} ({student.studentId})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateSession(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={!selectedRoster || !sessionName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}