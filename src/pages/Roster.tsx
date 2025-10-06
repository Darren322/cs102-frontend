import { useState, useEffect } from "react";
import { Users, Plus, Search, Eye, Edit, Trash2, Download, Upload, X, UserPlus } from "lucide-react";
import Sidebar from "../components/Sidebar"

type Student = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  enrollmentDate: string;
  status: 'active' | 'inactive';
};

type Roster = {
  id: string;
  name: string;
  course: string;
  courseCode: string;
  semester: string;
  students: Student[];
  createdAt: number;
  lastModified: number;
  instructor: string;
};

export default function RostersPage() {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateRoster, setShowCreateRoster] = useState(false);
  const [viewingRoster, setViewingRoster] = useState<Roster | null>(null);
  const [newRoster, setNewRoster] = useState({
    name: "",
    course: "",
    courseCode: "",
    semester: "Fall 2024"
  });

  // Initialize mock data
  useEffect(() => {
    const mockRosters: Roster[] = [
      {
        id: "roster_1",
        name: "Computer Science 101 - Morning Section",
        course: "Introduction to Computer Science",
        courseCode: "CS101",
        semester: "Fall 2024",
        instructor: "Prof. John Parker",
        createdAt: Date.now() - 86400000,
        lastModified: Date.now() - 3600000,
        students: [
          {
            id: "1",
            name: "John Doe",
            email: "john.doe@student.edu",
            studentId: "STUDENT_001",
            enrollmentDate: "2024-08-15",
            status: "active"
          },
          {
            id: "2",
            name: "Jane Smith",
            email: "jane.smith@student.edu",
            studentId: "STUDENT_002",
            enrollmentDate: "2024-08-15",
            status: "active"
          },
          {
            id: "3",
            name: "Bob Johnson",
            email: "bob.johnson@student.edu",
            studentId: "STUDENT_003",
            enrollmentDate: "2024-08-15",
            status: "active"
          },
          {
            id: "4",
            name: "Alice Brown",
            email: "alice.brown@student.edu",
            studentId: "STUDENT_004",
            enrollmentDate: "2024-08-16",
            status: "active"
          },
          {
            id: "5",
            name: "Charlie Wilson",
            email: "charlie.wilson@student.edu",
            studentId: "STUDENT_005",
            enrollmentDate: "2024-08-17",
            status: "inactive"
          }
        ]
      },
      {
        id: "roster_2",
        name: "Data Structures & Algorithms",
        course: "Advanced Programming Concepts",
        courseCode: "CS201",
        semester: "Fall 2024",
        instructor: "Prof. John Parker",
        createdAt: Date.now() - 172800000,
        lastModified: Date.now() - 7200000,
        students: [
          {
            id: "6",
            name: "David Lee",
            email: "david.lee@student.edu",
            studentId: "STUDENT_006",
            enrollmentDate: "2024-08-15",
            status: "active"
          },
          {
            id: "7",
            name: "Emma Davis",
            email: "emma.davis@student.edu",
            studentId: "STUDENT_007",
            enrollmentDate: "2024-08-15",
            status: "active"
          },
          {
            id: "8",
            name: "Frank Miller",
            email: "frank.miller@student.edu",
            studentId: "STUDENT_008",
            enrollmentDate: "2024-08-16",
            status: "active"
          }
        ]
      },
      {
        id: "roster_3",
        name: "Machine Learning Fundamentals",
        course: "Artificial Intelligence and ML",
        courseCode: "CS301",
        semester: "Fall 2024",
        instructor: "Prof. John Parker",
        createdAt: Date.now() - 259200000,
        lastModified: Date.now() - 86400000,
        students: [
          {
            id: "9",
            name: "Grace Chen",
            email: "grace.chen@student.edu",
            studentId: "STUDENT_009",
            enrollmentDate: "2024-08-15",
            status: "active"
          },
          {
            id: "10",
            name: "Henry Taylor",
            email: "henry.taylor@student.edu",
            studentId: "STUDENT_010",
            enrollmentDate: "2024-08-15",
            status: "active"
          }
        ]
      }
    ];

    setRosters(mockRosters);
  }, []);

  const handleCreateRoster = () => {
    if (!newRoster.name || !newRoster.course || !newRoster.courseCode) return;

    const roster: Roster = {
      id: `roster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: newRoster.name,
      course: newRoster.course,
      courseCode: newRoster.courseCode,
      semester: newRoster.semester,
      instructor: "Prof. John Parker",
      createdAt: Date.now(),
      lastModified: Date.now(),
      students: []
    };

    setRosters(prev => [roster, ...prev]);
    setShowCreateRoster(false);
    setNewRoster({ name: "", course: "", courseCode: "", semester: "Fall 2024" });
  };

  const deleteRoster = (rosterId: string) => {
    if (window.confirm('Are you sure you want to delete this roster? This action cannot be undone.')) {
      setRosters(prev => prev.filter(r => r.id !== rosterId));
    }
  };

  const exportRoster = (roster: Roster) => {
    const csvContent = [
      ['Student ID', 'Name', 'Email', 'Enrollment Date', 'Status'],
      ...roster.students.map(student => [
        student.studentId,
        student.name,
        student.email,
        student.enrollmentDate,
        student.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${roster.courseCode}_roster.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRosters = rosters.filter(roster =>
    roster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roster.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roster.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Course Rosters</h1>
                <p className="text-gray-600 mt-1">Manage student rosters for different courses and sections</p>
              </div>
              
              <div className="flex gap-3">
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Upload size={18} className="mr-2" />
                  Import CSV
                </button>
                <button
                  onClick={() => setShowCreateRoster(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} className="mr-2" />
                  New Roster
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rosters by name, course, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Rosters Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRosters.map((roster) => (
                <div key={roster.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{roster.name}</h3>
                        <p className="text-sm text-gray-600">{roster.course}</p>
                        <p className="text-xs text-gray-500">{roster.courseCode} - {roster.semester}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="text-gray-900">{roster.students.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active:</span>
                        <span className="text-gray-900">{roster.students.filter(s => s.status === 'active').length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">{new Date(roster.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Modified:</span>
                        <span className="text-gray-900">{new Date(roster.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingRoster(roster)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={16} className="mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => exportRoster(roster)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <Download size={16} className="mr-1" />
                        Export
                      </button>
                      <button
                        onClick={() => deleteRoster(roster.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRosters.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No rosters found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Create your first course roster to get started'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCreateRoster(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Roster
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Roster Modal */}
      {showCreateRoster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Create New Roster</h3>
                <button
                  onClick={() => setShowCreateRoster(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roster Name
                  </label>
                  <input
                    type="text"
                    value={newRoster.name}
                    onChange={(e) => setNewRoster(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., CS101 - Morning Section"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={newRoster.course}
                    onChange={(e) => setNewRoster(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="e.g., Introduction to Computer Science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newRoster.courseCode}
                    onChange={(e) => setNewRoster(prev => ({ ...prev, courseCode: e.target.value }))}
                    placeholder="e.g., CS101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={newRoster.semester}
                    onChange={(e) => setNewRoster(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                    <option value="Summer 2024">Summer 2024</option>
                    <option value="Winter 2024">Winter 2024</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateRoster(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoster}
                  disabled={!newRoster.name || !newRoster.course || !newRoster.courseCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Roster Modal */}
      {viewingRoster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{viewingRoster.name}</h3>
                  <p className="text-sm text-gray-600">{viewingRoster.course} ({viewingRoster.courseCode})</p>
                </div>
                <button
                  onClick={() => setViewingRoster(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4 flex justify-between items-center">
                <h4 className="font-medium text-gray-800">Students ({viewingRoster.students.length})</h4>
                <button className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  <UserPlus size={16} className="mr-1" />
                  Add Student
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewingRoster.students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.studentId}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{student.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{student.enrollmentDate}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <button className="text-blue-600 hover:text-blue-900 text-sm mr-2">Edit</button>
                          <button className="text-red-600 hover:text-red-900 text-sm">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}