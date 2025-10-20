import { useEffect, useState } from "react"
import api from "../../Api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css"; 
import "../../CSS/PL.css";
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { BookPlus, Users, ClipboardList, Star, FileText, Layers, Download, TrendingUp, Award, BarChart3 } from "lucide-react"

export default function DashboardPL() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [reports, setReports] = useState([])
  const [ratings, setRatings] = useState([])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      fetchData()
    }
  }, [])

  async function fetchData() {
    try {
      const cRes = await api.get("/courses")
      const lRes = await api.get("/users")
      const rRes = await api.get("/reports")
      const rtRes = await api.get("/ratings")

      setCourses(cRes.data)
      setLecturers(lRes.data.filter((u) => u.role === "lecturer"))
      setReports(rRes.data)
      setRatings(rtRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const exportAllDataToExcel = () => {
    const workbook = XLSX.utils.book_new()
    
    const coursesData = courses.map(course => ({
      'Course Code': course.course_code,
      'Course Name': course.course_name,
      'Faculty': course.faculty_name,
      'Stream ID': course.stream_id,
      'Total Students': course.total_registered_students,
      'Status': course.status
    }))
    const coursesWorksheet = XLSX.utils.json_to_sheet(coursesData)
    XLSX.utils.book_append_sheet(workbook, coursesWorksheet, 'Courses')
    
    const reportsData = reports.map(report => ({
      'Report ID': report.id,
      'Lecturer ID': report.lecturer_id,
      'Course ID': report.course_id,
      'Week': report.week_of_reporting,
      'Students Present': report.actual_students_present,
      'Topic': report.topic_taught
    }))
    const reportsWorksheet = XLSX.utils.json_to_sheet(reportsData)
    XLSX.utils.book_append_sheet(workbook, reportsWorksheet, 'Reports')
    
    const ratingsData = ratings.map(rating => ({
      'Rating ID': rating.id,
      'Lecturer ID': rating.lecturer_id,
      'Course ID': rating.course_id,
      'Rating': rating.rating,
      'Comment': rating.comment
    }))
    const ratingsWorksheet = XLSX.utils.json_to_sheet(ratingsData)
    XLSX.utils.book_append_sheet(workbook, ratingsWorksheet, 'Ratings')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `program_leader_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const totalCourses = courses.length
  const totalLecturers = lecturers.length
  const totalReports = reports.length
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratings.length).toFixed(1)
    : "N/A"

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <Dashboard user={user}>
      <div className="pl-dashboard">
        {/* Hero Header */}
        <div className="pl-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="pl-icon">
                  <Layers size={48} />
                </div>
                <div>
                  <h1 className="pl-title mb-1">Program Leader Dashboard</h1>
                  <p className="pl-subtitle mb-0">Overview of all academic operations</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportAllDataToExcel}
                className="btn btn-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export All Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - 4 cards in 1 row */}
        <div className="row g-4 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="pl-stat-card pl-stat-orange">
              <div className="stat-icon-bg">
                <BookPlus size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalCourses}</div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>Active Programs</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="pl-stat-card pl-stat-blue">
              <div className="stat-icon-bg">
                <Users size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalLecturers}</div>
                <div className="stat-label">Lecturers</div>
                <div className="stat-trend">
                  <Award size={16} />
                  <span>Faculty Members</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="pl-stat-card pl-stat-green">
              <div className="stat-icon-bg">
                <ClipboardList size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalReports}</div>
                <div className="stat-label">Reports</div>
                <div className="stat-trend">
                  <BarChart3 size={16} />
                  <span>Submitted</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="pl-stat-card pl-stat-yellow">
              <div className="stat-icon-bg">
                <Star size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{avgRating}</div>
                <div className="stat-label">Avg Rating</div>
                <div className="stat-trend">
                  <Award size={16} />
                  <span>Performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses - Full Width */}
        <div className="mb-4">
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-orange">
                  <BookPlus size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Recent Courses</h3>
                  <p className="pl-card-subtitle mb-0">Latest courses added</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-orange">{courses.length}</span>
            </div>
            <div className="card-body">
              {courses.length > 0 ? (
                <div className="row g-3">
                  {courses.slice(0, 6).map((c) => (
                    <div key={c.id} className="col-md-6 col-lg-4">
                      <div style={{ padding: '1rem', background: '#fef9f3', borderRadius: '0.5rem', borderLeft: '3px solid #e67e22', height: '100%' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span style={{ fontWeight: '700', color: '#e67e22', fontSize: '0.875rem' }}>{c.course_code}</span>
                          <span className={`badge ${c.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {c.status}
                          </span>
                        </div>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{c.course_name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>{c.faculty_name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
                          Stream: <span className="week-badge">{c.stream_id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <BookPlus size={48} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">No courses yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Reports - Full Width */}
        <div className="mb-4">
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-green">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Recent Reports</h3>
                  <p className="pl-card-subtitle mb-0">Latest submissions</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-green">{reports.length}</span>
            </div>
            <div className="card-body">
              {reports.length > 0 ? (
                <div className="row g-3">
                  {reports.slice(0, 6).map((r) => (
                    <div key={r.id} className="col-md-6 col-lg-4">
                      <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', borderLeft: '3px solid #27ae60', height: '100%' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div style={{ fontWeight: '600' }}>Report #{r.id}</div>
                          <span className="week-badge">Week {r.week_of_reporting}</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                          <strong>{r.actual_students_present}</strong> students present
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                          Lecturer ID: <strong>{r.lecturer_id}</strong>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
                          Course ID: <strong>{r.course_id}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FileText size={48} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">No reports yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Ratings - Full Width */}
        <div className="mb-4">
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-yellow">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Top Ratings</h3>
                  <p className="pl-card-subtitle mb-0">Student feedback</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-yellow">{ratings.length}</span>
            </div>
            <div className="card-body">
              {ratings.length > 0 ? (
                <div className="row g-3">
                  {ratings.slice(0, 6).map((r) => (
                    <div key={r.id} className="col-md-6 col-lg-4">
                      <div className="pl-rating-item" style={{ height: '100%' }}>
                        <div className="rating-header-pl">
                          <div className="lecturer-badge">L-{r.lecturer_id}</div>
                          <div className="rating-stars-pl">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < r.rating ? "star-filled-pl" : "star-empty-pl"}
                                fill={i < r.rating ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="rating-comment-pl">"{r.comment}"</p>
                        <div className="rating-meta-pl">Course ID: {r.course_id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small-pl text-center py-5">
                  <Star size={48} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">No ratings yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lecturers Overview - Full Width */}
        <div className="mb-4">
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-blue">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Lecturers</h3>
                  <p className="pl-card-subtitle mb-0">Faculty overview</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-blue">{lecturers.length}</span>
            </div>
            <div className="card-body">
              {lecturers.length > 0 ? (
                <div className="row g-3">
                  {lecturers.slice(0, 6).map((l) => (
                    <div key={l.id} className="col-md-6 col-lg-4">
                      <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem', borderLeft: '3px solid #3498db', height: '100%' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div style={{ fontWeight: '600' }}>{l.full_name}</div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3498db', padding: '0.25rem 0.5rem', background: 'white', borderRadius: '0.25rem' }}>
                            {l.staff_student_id}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d', wordBreak: 'break-word' }}>{l.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <Users size={48} className="text-muted mb-2" />
                  <p className="text-muted small mb-0">No lecturers yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  )
}