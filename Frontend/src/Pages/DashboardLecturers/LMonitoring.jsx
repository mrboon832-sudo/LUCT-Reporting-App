import { useEffect, useState } from "react"
import api from '../../api/api';
import Dashboard from '../../Components/Dashboard'; 
import '../../CSS/Dashboard.css'; 
import "../../CSS/Lecturer.css";
import { BookOpen, Users, Download, BarChart3, Eye, Calendar, TrendingUp } from "lucide-react"

export default function MonitoringLecturers() {
  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      fetchData(parsed.id)
    }
  }, [])

  async function fetchData(lecturerId) {
    try {
      setLoading(true)
      const [assignRes, coursesRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/courses")
      ])
      
      const lecturerAssignments = assignRes.data.filter(
        (a) => a.lecturer_id === lecturerId
      )
      setAssignments(lecturerAssignments)
      setCourses(coursesRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalStudents = assignments.reduce((sum, a) => {
    const course = courses.find(c => c.id === a.course_id)
    return sum + (course?.total_registered_students || 0)
  }, 0)

  const isCourseActive = (course) => {
    return course?.status?.toLowerCase() === 'active'
  }

  const activeCoursesCount = assignments.filter(a => {
    const course = courses.find(c => c.id === a.course_id)
    return isCourseActive(course)
  }).length

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <Dashboard user={user}>
      <div className="lecturer-dashboard">
        <div className="dashboard-hero mb-5">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="hero-icon">
                  <Eye size={48} />
                </div>
                <div>
                  <h1 className="hero-title mb-2">Course Monitoring</h1>
                  <p className="hero-subtitle mb-0">
                    Monitor and manage your assigned courses
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button className="btn btn-light btn-lg shadow-sm">
                <Download size={20} className="me-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-xl-3 col-md-6">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <BookOpen size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{assignments.length}</div>
                <div className="stat-label">Assigned Courses</div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="stat-card stat-card-green">
              <div className="stat-icon">
                <Users size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalStudents}</div>
                <div className="stat-label">Total Students</div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="stat-card stat-card-yellow">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{activeCoursesCount}</div>
                <div className="stat-label">Active Courses</div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">
                <BarChart3 size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {assignments.length > 0 ? Math.round((activeCoursesCount / assignments.length) * 100) : 0}%
                </div>
                <div className="stat-label">Active Rate</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modern-card mb-5">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <BookOpen size={24} className="text-primary" />
              <h3 className="card-title-modern mb-0">Assigned Courses</h3>
            </div>
            <span className="badge bg-primary-subtle text-primary">
              {assignments.length} courses • {activeCoursesCount} active
            </span>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading courses...</p>
              </div>
            ) : assignments.length > 0 ? (
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Faculty</th>
                      <th>Stream</th>
                      <th>Students</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => {
                      const course = courses.find((c) => c.id === assignment.course_id)
                      const isActive = isCourseActive(course)
                      
                      return (
                        <tr key={assignment.id}>
                          <td>
                            <span className="course-code">{course?.course_code}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div className="course-avatar">
                                <BookOpen size={16} />
                              </div>
                              <div>
                                <div className="fw-semibold">{course?.course_name}</div>
                                <div className="text-muted small">{course?.credits || 'N/A'} Credits</div>
                              </div>
                            </div>
                          </td>
                          <td>{course?.faculty_name}</td>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary">
                              {course?.stream_id}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Users size={16} className="text-muted" />
                              <span className="fw-semibold">
                                {course?.total_registered_students || 0}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No courses assigned</h5>
                <p className="text-muted">
                  You haven't been assigned to any courses yet
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="modern-card">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <BarChart3 size={24} className="text-success" />
              <h3 className="card-title-modern mb-0">Course Overview</h3>
            </div>
            <span className="badge bg-success-subtle text-success">
              Quick View
            </span>
          </div>
          <div className="card-body">
            {assignments.length > 0 ? (
              <div className="row g-4">
                {assignments.map((assignment) => {
                  const course = courses.find((c) => c.id === assignment.course_id)
                  const isActive = isCourseActive(course)
                  
                  return (
                    <div key={assignment.id} className="col-xl-4 col-lg-6">
                      <div className="course-overview-card">
                        <div className="course-card-header">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="course-code">{course?.course_code}</div>
                            <span className={`status-indicator ${isActive ? 'active' : 'inactive'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <h5 className="course-title">{course?.course_name}</h5>
                        </div>
                        
                        <div className="course-info">
                          <div className="info-item">
                            <Users size={16} />
                            <span>{course?.total_registered_students || 0} Students</span>
                          </div>
                          <div className="info-item">
                            <BookOpen size={16} />
                            <span>{course?.faculty_name}</span>
                          </div>
                          <div className="info-item">
                            <Calendar size={16} />
                            <span>Stream {course?.stream_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <BarChart3 size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No courses to display</h5>
                <p className="text-muted">
                  Course overview will appear here once you're assigned to courses
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  )
}