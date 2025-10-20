// src/Pages/Lecturer/DashboardLecturers.jsx
import { useEffect, useState } from "react"
import api from '../../api/api';
import Dashboard from '../../Components/Dashboard'; 
import '../../CSS/Dashboard.css'; 
import "../../CSS/Lecturer.css";
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { BookOpen, FileText, Star, UserCircle, Download, Users, Award } from "lucide-react"

export default function DashboardLecturers() {
  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [reports, setReports] = useState([])
  const [ratings, setRatings] = useState([])

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
      const assignRes = await api.get("/assignments")
      const lecturerAssignments = assignRes.data.filter(
        (a) => a.lecturer_id === lecturerId
      )
      setAssignments(lecturerAssignments)

      const allCourses = await api.get("/courses")
      setCourses(allCourses.data)

      const reportRes = await api.get("/reports")
      const lecturerReports = reportRes.data.filter(
        (r) => r.lecturer_id === lecturerId
      )
      setReports(lecturerReports)

      const ratingRes = await api.get("/ratings")
      const lecturerRatings = ratingRes.data.filter(
        (r) => r.lecturer_id === lecturerId
      )
      setRatings(lecturerRatings)
    } catch (err) {
      console.error(err)
    }
  }

  const exportAllMyDataToExcel = () => {
    const workbook = XLSX.utils.book_new()
    
    const coursesData = assignments.map(assignment => {
      const course = courses.find((c) => c.id === assignment.course_id)
      return {
        'Course Code': course?.course_code,
        'Course Name': course?.course_name,
        'Faculty': course?.faculty_name,
        'Stream ID': course?.stream_id,
        'Total Students': course?.total_registered_students,
        'Status': course?.status
      }
    })
    const coursesWorksheet = XLSX.utils.json_to_sheet(coursesData)
    XLSX.utils.book_append_sheet(workbook, coursesWorksheet, 'My Courses')
    
    const reportsData = reports.map(report => {
      const course = courses.find((c) => c.id === report.course_id)
      return {
        'Report ID': report.id,
        'Course': course?.course_name,
        'Week': report.week_of_reporting,
        'Date': new Date(report.date_of_lecture).toLocaleDateString(),
        'Students Present': report.actual_students_present,
        'Topic': report.topic_taught,
        'Venue': report.venue
      }
    })
    const reportsWorksheet = XLSX.utils.json_to_sheet(reportsData)
    XLSX.utils.book_append_sheet(workbook, reportsWorksheet, 'My Reports')
    
    const ratingsData = ratings.map(rating => {
      const course = courses.find((c) => c.id === rating.course_id)
      return {
        'Rating ID': rating.id,
        'Course': course?.course_name,
        'Rating': rating.rating,
        'Comment': rating.comment
      }
    })
    const ratingsWorksheet = XLSX.utils.json_to_sheet(ratingsData)
    XLSX.utils.book_append_sheet(workbook, ratingsWorksheet, 'My Ratings')
    
    const summaryData = [{
      'Total Courses': assignments.length,
      'Total Reports': reports.length,
      'Total Ratings': ratings.length,
      'Export Date': new Date().toLocaleDateString(),
      'Lecturer': user?.full_name,
      'Lecturer ID': user?.staff_student_id
    }]
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `lecturer_dashboard_${user?.staff_student_id}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Calculate stats
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratings.length).toFixed(1)
    : "N/A"
  
  const totalStudents = assignments.reduce((sum, a) => {
    const course = courses.find(c => c.id === a.course_id)
    return sum + (course?.total_registered_students || 0)
  }, 0)

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
        {/* Hero Header */}
        <div className="dashboard-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="hero-icon">
                  <UserCircle size={56} />
                </div>
                <div>
                  <h1 className="hero-title mb-1">Welcome back, {user?.full_name}</h1>
                  <p className="hero-subtitle mb-0">
                    <span className="me-3">📧 {user?.email}</span>
                    <span>🆔 {user?.staff_student_id}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportAllMyDataToExcel}
                className="btn btn-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export All Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="stat-card stat-card-green">
              <div className="stat-icon">
                <BookOpen size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{assignments.length}</div>
                <div className="stat-label">Active Courses</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <Users size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalStudents}</div>
                <div className="stat-label">Total Students</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">
                <FileText size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{reports.length}</div>
                <div className="stat-label">Reports Submitted</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-yellow">
              <div className="stat-icon">
                <Award size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{avgRating}</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses Summary */}
        <div className="modern-card mb-4">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <BookOpen size={24} className="text-success" />
              <h3 className="card-title-modern mb-0">Recent Courses</h3>
            </div>
            <span className="badge bg-success-subtle text-success">{assignments.length} courses</span>
          </div>
          <div className="card-body">
            {assignments.length > 0 ? (
              <div className="row g-3">
                {assignments.slice(0, 3).map((a) => {
                  const course = courses.find((c) => c.id === a.course_id)
                  return (
                    <div key={a.id} className="col-md-4">
                      <div style={{ background: 'linear-gradient(135deg, #f8f9fa, #ffffff)', border: '2px solid #e9ecef', borderRadius: '0.75rem', padding: '1rem' }}>
                        <span className="course-code" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{course?.course_code}</span>
                        <h5 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{course?.course_name}</h5>
                        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>{course?.faculty_name}</p>
                        <span className="badge bg-primary-subtle text-primary">
                          {course?.total_registered_students || 0} students
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen size={48} className="text-muted mb-3" />
                <p className="text-muted">No courses assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports Preview - Full Width */}
        <div className="modern-card mb-4">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <FileText size={24} className="text-warning" />
              <h3 className="card-title-modern mb-0">Recent Reports</h3>
            </div>
            <span className="badge bg-warning-subtle text-warning">{reports.length} reports</span>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            {reports.length > 0 ? (
              <div className="row g-4">
                {reports.slice(0, 3).map((r) => {
                  const course = courses.find((c) => c.id === r.course_id)
                  return (
                    <div key={r.id} className="col-lg-4 col-md-6">
                      <div style={{ 
                        padding: '1.5rem', 
                        background: 'linear-gradient(135deg, #fff8f0 0%, #ffffff 100%)', 
                        borderRadius: '0.75rem', 
                        borderLeft: '4px solid #fd7e14',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        height: '100%',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(253, 126, 20, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileText size={24} color="#fd7e14" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h6 style={{ 
                              fontWeight: '700', 
                              marginBottom: '0.5rem',
                              fontSize: '1rem',
                              color: '#212529'
                            }}>
                              {course?.course_name || 'Unknown Course'}
                            </h6>
                            <span className="badge bg-primary-subtle text-primary mb-2">
                              {course?.course_code || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '0.9375rem', 
                          color: '#6c757d',
                          lineHeight: '1.6'
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span style={{ fontWeight: '600', color: '#495057' }}>Week:</span>
                            <span>{r.week_of_reporting}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontWeight: '600', color: '#495057' }}>Date:</span>
                            <span>{new Date(r.date_of_lecture).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <FileText size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No reports yet</h5>
                <p className="text-muted small mb-0">Your submitted reports will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Student Ratings Preview - Full Width */}
        <div className="modern-card mb-4">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <Star size={24} className="text-warning" />
              <h3 className="card-title-modern mb-0">Recent Ratings</h3>
            </div>
            <span className="badge bg-warning-subtle text-warning">{ratings.length} ratings</span>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            {ratings.length > 0 ? (
              <div className="row g-4">
                {ratings.slice(0, 3).map((r) => {
                  const course = courses.find((c) => c.id === r.course_id)
                  return (
                    <div key={r.id} className="col-lg-4 col-md-6">
                      <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #fffbf0 0%, #ffffff 100%)',
                        borderRadius: '0.75rem',
                        borderLeft: '4px solid #ffc107',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        height: '100%',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <span className="badge bg-success-subtle text-success mb-2">
                              {course?.course_code || 'N/A'}
                            </span>
                            <h6 style={{ 
                              fontSize: '0.9375rem', 
                              fontWeight: '700',
                              marginBottom: '0.5rem',
                              color: '#212529'
                            }}>
                              {course?.course_name || 'Unknown Course'}
                            </h6>
                          </div>
                        </div>
                        
                        <div className="d-flex align-items-center gap-3 mb-3" style={{
                          padding: '1rem',
                          background: 'rgba(255, 193, 7, 0.08)',
                          borderRadius: '0.5rem'
                        }}>
                          <div className="d-flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={20}
                                className={i < r.rating ? "star-filled" : "star-empty"}
                                fill={i < r.rating ? "#ffc107" : "none"}
                                color={i < r.rating ? "#ffc107" : "#dee2e6"}
                              />
                            ))}
                          </div>
                          <span style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '700',
                            color: '#ffc107'
                          }}>
                            {r.rating}/5
                          </span>
                        </div>

                        <p style={{
                          fontSize: '0.9375rem',
                          color: '#495057',
                          fontStyle: 'italic',
                          marginBottom: '0',
                          lineHeight: '1.6',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          "{r.comment || 'No comment provided'}"
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <Award size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No ratings yet</h5>
                <p className="text-muted small mb-0">Student ratings will appear here once submitted</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  )
}