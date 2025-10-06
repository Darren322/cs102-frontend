import { Users, Clock, Settings, FileText, User, BarChart3, LogOut, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    { id: "sessions", label: "Sessions", icon: Clock, path: "/sessions" },
    { id: "rosters", label: "Rosters", icon: Users, path: "/rosters" },
    { id: "students", label: "Students", icon: User, path: "/students" },
    { id: "reports", label: "Reports", icon: FileText, path: "/reports" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  const handleLogout = () => {
    // Add logout logic here
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className={`w-64 bg-white shadow-lg border-r border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Smart Attendance</h1>
        <p className="text-sm text-gray-600 mt-1">Professor Dashboard</p>
      </div>
      
      <nav className="mt-6 flex-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JP</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Prof. John Parker</p>
            <p className="text-xs text-gray-500 truncate">john.parker@university.edu</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
}