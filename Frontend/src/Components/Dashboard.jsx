import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import '../CSS/Dashboard.css'; 

export default function Dashboard({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar user={user} open={sidebarOpen} onClose={closeSidebar} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
        />
      )}
      
      <div 
        className="dashboard-main" 
        style={{ 
          marginLeft: sidebarOpen && !isMobile ? "280px" : "0" 
        }}
      >
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}