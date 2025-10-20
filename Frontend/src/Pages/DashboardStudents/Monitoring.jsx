// src/Pages/Student/StudentMonitoring.jsx
import { useEffect, useState } from "react";
import api from "../../api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/Student.css";
import { BookOpen, TrendingUp, Clock, Eye, Search, Calendar, Award, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function StudentMonitoring() {
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  // Mock progress data (in production, fetch from API)
  const [courseProgress, setCourseProgress] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchData(parsedUser.id);
    }
  }, []);

  async function fetchData(studentId) {
    try {
      const enrollRes = await api.get("/enrollments");
      const filtered = enrollRes.data.filter((e) => e.student_id === studentId);
      setEnrollments(filtered);

      const coursesRes = await api.get("/courses");
      setCourses(coursesRes.data);

      // Mock progress data (replace with actual API call)
      const mockProgress = {};
      filtered.forEach(e => {
        mockProgress[e.course_id] = {
          progress: Math.floor(Math.random() * 40) + 60, // 60-100%
          attendance: Math.floor(Math.random() * 20) + 80, // 80-100%
          assignments: Math.floor(Math.random() * 3) + 8, // 8-10
          totalAssignments: 10,
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      });
      setCourseProgress(mockProgress);
    } catch (err) {
      console.error(err);
    }
  }

  const exportMonitoringData = () => {
    const data = enrollments.map(e => {
      const course = courses.find(c => c.id === e.course_id);
      const progress = courseProgress[e.course_id] || {};
      return {
        'Course Code': course?.course_code,
        'Course Name': course?.course_name,
        'Faculty': course?.faculty_name,
        'Progress': progress.progress + '%',
        'Attendance': progress.attendance + '%',
        'Assignments': `${progress.assignments}/${progress.totalAssignments}`,
        'Last Activity': new Date(progress.lastActivity).toLocaleDateString(),
        'Enrollment Date': new Date(e.enrollment_date).toLocaleDateString()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Course Monitoring");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Course_Monitoring_${user?.staff_student_id}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setMessage("✅ Monitoring data exported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const filteredEnrollments = enrollments.filter(e => {
    const course = courses.find(c => c.id === e.course_id);
    if (!course) return false;
    return course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate overall stats
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (courseProgress[e.course_id]?.progress || 0), 0) / enrollments.length)
    : 0;

  const avgAttendance = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (courseProgress[e.course_id]?.attendance || 0), 0) / enrollments.length)
    : 0;

  const totalAssignments = enrollments.reduce((sum, e) => sum + (courseProgress[e.course_id]?.assignments || 0), 0);

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
        {/* Page Header */}
        <div className="dashboard-hero mb-4" style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '1rem'
        }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="hero-icon bg-white bg-opacity-20 p-3 rounded-3">
                  <Eye size={48} color="white" />
                </div>
                <div>
                  <h1 className="hero-title mb-1 text-white">Course Monitoring</h1>
                  <p className="hero-subtitle mb-0 text-white-80">
                    Track your progress, attendance, and performance
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button onClick={exportMonitoringData} className="btn btn-light btn-lg">
                <Download size={20} className="me-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* First 4 Stats Cards in a Row */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{avgProgress}%</div>
                <div className="stat-label">Avg Progress</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-green">
              <div className="stat-icon">
                <Calendar size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{avgAttendance}%</div>
                <div className="stat-label">Avg Attendance</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-purple">
              <div className="stat-icon">
                <Award size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalAssignments}</div>
                <div className="stat-label">Assignments Done</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">
                <BookOpen size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{enrollments.length}</div>
                <div className="stat-label">Total Courses</div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className="alert alert-success alert-dismissible fade show mb-4">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Search */}
        <div className="modern-card mb-4">
          <div className="card-body">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control form-control-lg"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>

        {/* Course Progress Cards */}
        <div className="modern-card">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <BookOpen size={24} className="text-primary" />
              <h3 className="card-title-modern mb-0">Course Performance</h3>
            </div>
          </div>
          <div className="card-body">
            {filteredEnrollments.length > 0 ? (
              <div className="row g-4">
                {filteredEnrollments.map((e) => {
                  const course = courses.find((c) => c.id === e.course_id);
                  const progress = courseProgress[e.course_id] || {};
                  return (
                    <div key={e.id} className="col-md-6">
                      <div style={{ 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                        border: '2px solid #e2e8f0', 
                        borderRadius: '1rem', 
                        padding: '1.5rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(30, 144, 255, 0.15)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                        
                        {/* Course Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div style={{ 
                              background: 'linear-gradient(135deg, #1e90ff, #4da6ff)', 
                              color: 'white', 
                              padding: '0.375rem 0.75rem', 
                              borderRadius: '0.5rem', 
                              fontWeight: '700', 
                              fontSize: '0.875rem', 
                              display: 'inline-block', 
                              marginBottom: '0.5rem' 
                            }}>
                              {course?.course_code}
                            </div>
                            <h5 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0.5rem 0 0.25rem 0' }}>
                              {course?.course_name}
                            </h5>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                              {course?.faculty_name}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Overall Progress</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e90ff' }}>
                              {progress.progress || 0}%
                            </span>
                          </div>
                          <div style={{ background: '#e2e8f0', borderRadius: '1rem', height: '10px', overflow: 'hidden' }}>
                            <div style={{ 
                              background: 'linear-gradient(90deg, #1e90ff, #4da6ff)', 
                              width: `${progress.progress || 0}%`, 
                              height: '100%', 
                              borderRadius: '1rem', 
                              transition: 'width 0.3s ease' 
                            }}></div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>Attendance</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                                {progress.attendance || 0}%
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div style={{ background: 'rgba(147, 51, 234, 0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>Assignments</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#9333ea' }}>
                                {progress.assignments || 0}/{progress.totalAssignments || 10}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Last Activity */}
                        <div style={{ 
                          borderTop: '1px solid #e2e8f0', 
                          paddingTop: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>
                          <Clock size={14} />
                          <span>Last activity: {new Date(progress.lastActivity).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <BookOpen size={64} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {searchTerm ? "No courses match your search" : "No courses enrolled"}
                </h5>
                <p className="text-muted small">
                  {searchTerm ? "Try a different search term" : "Enroll in courses to see your progress"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}