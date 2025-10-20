import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, FileText, BarChart3, Star, LogOut, Users, Eye, TrendingUp } from "lucide-react";

export default function Sidebar({ user, open, onClose }) {
  const location = useLocation();

  const menuItems = {
    student: [
      { path: "/student", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/student/monitoring", icon: Eye, label: "Course Monitoring" }, 
      { path: "/student/ratings", icon: Star, label: "Rate Lecturers" },        
    ],
    lecturer: [
      { path: "/lecturer", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/lecturer/reports", icon: FileText, label: "Reports" },
      { path: "/lecturer/ratings", icon: Star, label: "My Ratings" },
      { path: "/lecturer/monitoring", icon: TrendingUp, label: "Monitoring" },
    ],
    pl: [
      { path: "/pl", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/pl/courses", icon: BookOpen, label: "Courses" },
      { path: "/pl/reports", icon: FileText, label: "Reports" },
      { path: "/pl/monitoring", icon: Eye, label: "Monitoring" },
    ],
    prl: [
      { path: "/prl", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/prl/courses", icon: BookOpen, label: "Stream Courses" },
      { path: "/prl/reports", icon: FileText, label: "Reports" },
      { path: "/prl/ratings", icon: Star, label: "Ratings" },
      { path: "monitoring", icon: Eye,  label: "Monitoring"},
    ],
    admin: [
      { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/enrollments", icon: Users, label: "Enrollments" },
      { path: "/admin/courses", icon: BookOpen, label: "Courses" },
      { path: "/admin/streams", icon: BarChart3, label: "Streams" },
      { path: "/admin/monitoring", icon: Eye, label: "Monitoring" },
    ]
  };

  const filtered = menuItems[user?.role] || [];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <h4>LUCT</h4>
        <small>Leaders in innovation</small>
      </div>

      <div className="sidebar-user">
        <div className="avatar">{user?.full_name?.charAt(0) || "U"}</div>
        <div>
          <div>{user?.full_name || "User"}</div>
          <small>{user?.role || "user"}</small>
        </div>
      </div>

      <ul className="sidebar-nav">
        {filtered.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={active ? "active" : ""}
                onClick={handleLinkClick}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button onClick={handleLogout} className="btn text-left w-100">
            <LogOut size={18} /> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}