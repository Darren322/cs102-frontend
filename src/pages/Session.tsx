import { useState, useEffect } from "react";
import { Camera, Upload, Plus, Calendar, Search, Filter, Eye, Trash2, MoreHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";


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
    // Mock rosters
    const mockRosters: Roster[] = [
      {
        id: "roster_1",
        name: "Computer Science 101",
        course: "CS101",
        semester: "Fall 2024",
        students: [
          { id: "1", name: "John Doe", email: "john@example.com", studentId: "STUDENT_001" },
          { id: "2", name: "Jane Smith", email: "jane@example.com", studentId: "STUDENT_002" },
          { id: "3", name: "Bob Johnson", email: "bob@example.com", studentId: "STUDENT_003" },
          { id: "4", name: "Alice Brown", email: "alice@example.com", studentId: "STUDENT_004" },
          { id: "5", name: "Charlie Wilson", email: "charlie@example.com", studentId: "STUDENT_005" },
        ],
        createdAt: Date.now() - 86400000
      },
      {
        id: "roster_2", 
        name: "Data Structures & Algorithms",
        course: "CS201",
        semester: "Fall 2024",
        students: [
          { id: "6", name: "David Lee", email: "david@example.com", studentId: "STUDENT_006" },
          { id: "7", name: "Emma Davis", email: "emma@example.com", studentId: "STUDENT_007" },
          { id: "8", name: "Frank Miller", email: "frank@example.com", studentId: "STUDENT_008" },
        ],
        createdAt: Date.now() - 172800000
      },
      {
        id: "roster_3",
        name: "Machine Learning Fundamentals", 
        course: "CS301",
        semester: "Fall 2024",
        students: [
          { id: "9", name: "Grace Chen", email: "grace@example.com", studentId: "STUDENT_009" },
          { id: "10", name: "Henry Taylor", email: "henry@example.com", studentId: "STUDENT_010" },
        ],
        createdAt: Date.now() - 259200000
      }
    ];

    // Mock existing sessions
    const mockSessions: SessionRecord[] = [
      {
        id: "session_1",
        name: "CS101 - Introduction to Programming",
        rosterId: "roster_1",
        rosterName: "Computer Science 101",
        course: "CS101",
        createdAt: Date.now() - 3600000,
        status: 'completed',
        attendanceCount: 4,
        totalStudents: 5,
        duration: 3600,
        recognitionMode: 'live'
      },
      {
        id: "session_2", 
        name: "CS201 - Lab Session Week 3",
        rosterId: "roster_2",
        rosterName: "Data Structures & Algorithms", 
        course: "CS201",
        createdAt: Date.now() - 1800000,
        status: 'draft',
        attendanceCount: 0,
        totalStudents: 3
      },
      {
        id: "session_3",
        name: "CS301 - Neural Networks Lecture",
        rosterId: "roster_3", 
        rosterName: "Machine Learning Fundamentals",
        course: "CS301",
        createdAt: Date.now() - 7200000,
        status: 'completed',
        attendanceCount: 2,
        totalStudents: 2,
        duration: 5400,
        recognitionMode: 'upload'
      }
    ];

    setRosters(mockRosters);
    setSessions(mockSessions);
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

  // Delete session
  const deleteSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  // View session results
  const viewSessionResults = (sessionId: string) => {
    navigate(`/session-results/${sessionId}`);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.rosterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Sessions</h1>
                <p className="text-gray-600 mt-1">Create and manage attendance sessions based on course rosters</p>
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
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{session.name}</h3>
                        <p className="text-sm text-gray-600">{session.rosterName}</p>
                        <p className="text-xs text-gray-500">{session.course}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.status === 'active' ? 'bg-green-100 text-green-800' :
                          session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attendance:</span>
                        <span className="text-gray-900">{session.attendanceCount}/{session.totalStudents}</span>
                      </div>
                      {session.duration && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Duration:</span>
                          <span className="text-gray-900">{Math.round(session.duration / 60)} min</span>
                        </div>
                      )}
                      {session.recognitionMode && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Mode:</span>
                          <span className="text-gray-900 capitalize">{session.recognitionMode}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
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
                      {session.status === 'completed' && (
                        <button 
                          onClick={() => viewSessionResults(session.id)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Eye size={16} className="mr-1" />
                          View Results
                        </button>
                      )}
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredSessions.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No sessions found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first attendance session to get started'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateSession(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Session
                  </button>
                )}
              </div>
            )}
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