// navbar.jsx
import { Menu } from "lucide-react";

export default function Navbar({ onToggleSidebar, user }) {
  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase() || "U";
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <h1 className="navbar-title">Dashboard</h1>
      </div>
      
      <div className="navbar-user">
        <div className="user-info">
          <p className="user-name">{user?.full_name || "User"}</p>
          <p className="user-role">{user?.role || "User"}</p>
        </div>
        <div className="user-avatar">
          {getInitials(user?.full_name)}
        </div>
      </div>
    </div>
  );
}