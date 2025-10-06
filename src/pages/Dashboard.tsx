import { useState, useEffect } from "react";
import { Users, Clock, TrendingUp, Calendar, Activity, Book, CheckCircle, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    activeRosters: 0,
    averageAttendance: 0,
    todaySessions: 0,
    pendingSessions: 0
  });

  const [recentSessions, setRecentSessions] = useState([
    {
      id: 1,
      name: "CS101 - Introduction to Programming",
      course: "CS101",
      date: new Date().toISOString().split('T')[0],
      attendance: "24/30",
      status: "completed"
    },
    {
      id: 2,
      name: "CS201 - Data Structures Lab",
      course: "CS201", 
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      attendance: "18/22",
      status: "completed"
    },
    {
      id: 3,
      name: "CS301 - Machine Learning",
      course: "CS301",
      date: new Date().toISOString().split('T')[0],
      attendance: "0/25",
      status: "scheduled"
    }
  ]);

  const [upcomingSessions, setUpcomingSessions] = useState([
    {
      id: 1,
      name: "CS101 - Variables and Functions",
      course: "CS101",
      time: "10:00 AM",
      students: 30,
      room: "Lab 203"
    },
    {
      id: 2,
      name: "CS201 - Algorithm Analysis", 
      course: "CS201",
      time: "2:00 PM",
      students: 22,
      room: "Room 105"
    }
  ]);

  useEffect(() => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setStats({
        totalSessions: 47,
        totalStudents: 156,
        activeRosters: 8,
        averageAttendance: 87.3,
        todaySessions: 3,
        pendingSessions: 2
      });
    }, 500);
  }, []);

  const statCards = [
    { title: "Total Sessions", value: stats.totalSessions, icon: Clock, color: "blue", change: "+12%" },
    { title: "Total Students", value: stats.totalStudents, icon: Users, color: "green", change: "+5%" },
    { title: "Active Rosters", value: stats.activeRosters, icon: Book, color: "purple", change: "+2" },
    { title: "Avg Attendance", value: `${stats.averageAttendance}%`, icon: TrendingUp, color: "orange", change: "+3.2%" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, Prof. Parker</p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card) => (
                <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className={`text-sm text-${card.color}-600 mt-1`}>{card.change} from last month</p>
                    </div>
                    <card.icon className={`w-8 h-8 text-${card.color}-600`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-blue-700 font-medium">Start New Session</span>
                </button>
                <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Users className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-green-700 font-medium">Manage Rosters</span>
                </button>
                <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Activity className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-purple-700 font-medium">View Reports</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sessions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Sessions</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{session.name}</p>
                          <p className="text-sm text-gray-600">{session.course} • {session.date}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">{session.attendance}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Today's Schedule</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{session.name}</p>
                          <p className="text-sm text-gray-600">{session.time} • {session.room}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{session.students} students</p>
                          <p className="text-xs text-gray-500">{session.course}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Face Recognition: Online</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Database: Connected</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-700">Camera Access: Limited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}