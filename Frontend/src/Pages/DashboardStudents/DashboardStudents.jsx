// src/Pages/Student/DashboardStudents.jsx
import { useEffect, useState } from "react";
import api from "../../Api/api";
import logo from "../Limkokwing_Lesotho_Logo.jpg";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/Student.css";
import { BookOpen, Star, CalendarDays, GraduationCap, TrendingUp, Clock, Users, Award } from "lucide-react";

export default function DashboardStudents() {
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);

  const currentYear = new Date().getFullYear();
  const currentSemester = new Date().getMonth() < 6 ? "Semester 1" : "Semester 2";
  const registrationStatus = "Active";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchEnrollments(parsedUser.id);
    }
  }, []);

  async function fetchEnrollments(studentId) {
    try {
      const res = await api.get("/enrollments");
      const filtered = res.data.filter((e) => e.student_id === studentId);
      setEnrollments(filtered);

      const allCourses = await api.get("/courses");
      setCourses(allCourses.data);
    } catch (err) {
      console.error(err);
    }
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Dashboard user={user}>
      <div className="student-dashboard">
        {/* Hero Header */}
        <div className="student-hero mb-4">
          <div className="hero-background"></div>
          <div className="hero-content">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="student-avatar">
                    <GraduationCap size={40} />
                  </div>
                  <div>
                    <h1 className="hero-title mb-1">Welcome, {user?.full_name}! 🎓</h1>
                    <p className="hero-subtitle mb-0">
                      {user?.email} • ID: {user?.staff_student_id}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 text-lg-end">
                <img src={logo} alt="LUCT Logo" className="university-logo" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row - Same format as StudentMonitoring */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <CalendarDays size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{currentYear}</div>
                <div className="stat-label">Academic Year</div>
                <div className="stat-subtitle">{currentSemester}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-green">
              <div className="stat-icon">
                <BookOpen size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{enrollments.length}</div>
                <div className="stat-label">Enrolled Courses</div>
                <div className="stat-subtitle">Active enrollments</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-purple">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <span className={`status-badge ${registrationStatus === "Active" ? "status-active" : "status-inactive"}`}>
                    {registrationStatus}
                  </span>
                </div>
                <div className="stat-label">Registration</div>
                <div className="stat-subtitle">Current status</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">
                <Award size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">0</div>
                <div className="stat-label">Completed</div>
                <div className="stat-subtitle">Courses finished</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses Summary */}
        <div className="modern-card">
          <div className="card-header-student">
            <div className="d-flex align-items-center gap-2">
              <BookOpen size={24} className="text-primary" />
              <div>
                <h3 className="card-title-student mb-0">Recent Courses</h3>
                <p className="card-subtitle-student mb-0">Quick overview of your courses</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {enrollments.length > 0 ? (
              <div className="row g-3">
                {enrollments.slice(0, 3).map((e) => {
                  const course = courses.find((c) => c.id === e.course_id);
                  return (
                    <div key={e.id} className="col-md-4">
                      <div className="bg-light bg-gradient border border-2 border-light-subtle rounded-3 p-3 h-100">
                        <div className="bg-primary bg-gradient text-white px-3 py-1 rounded-2 fw-bold small d-inline-block mb-2">
                          {course?.course_code}
                        </div>
                        <h5 className="fs-6 fw-bold mb-2">{course?.course_name}</h5>
                        <p className="text-muted small mb-0">{course?.faculty_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpen size={48} className="text-muted mb-2" />
                <p className="text-muted mb-0">No courses enrolled yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}