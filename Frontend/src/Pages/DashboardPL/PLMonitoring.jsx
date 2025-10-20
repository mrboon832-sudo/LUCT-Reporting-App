import { useEffect, useState } from "react"
import api from "../../Api/api"
import Dashboard from "../../Components/Dashboard"
import "../../CSS/Dashboard.css"
import "../../CSS/PL.css"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { 
  BookOpen, 
  Users, 
  Star, 
  Eye, 
  Download, 
  TrendingUp, 
  Award, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

export default function MonitoringPL() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('courses')
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [ratings, setRatings] = useState([])
  const [reports, setReports] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      fetchData()
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [cRes, lRes, rRes, repRes, aRes] = await Promise.all([
        api.get("/courses"),
        api.get("/users"),
        api.get("/ratings"),
        api.get("/reports"),
        api.get("/assignments")
      ])

      setCourses(cRes.data)
      setLecturers(lRes.data.filter(u => u.role === "lecturer"))
      setRatings(rRes.data)
      setReports(repRes.data)
      setAssignments(aRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getCourseMetrics = (courseId) => {
    const courseReports = reports.filter(r => r.course_id === courseId)
    const courseRatings = ratings.filter(r => r.course_id === courseId)
    
    const totalReports = courseReports.length
    const avgRating = courseRatings.length > 0
      ? (courseRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / courseRatings.length).toFixed(1)
      : 0
    
    const recentReports = courseReports.filter(report => {
      const reportDate = new Date(report.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return reportDate > weekAgo
    }).length

    return {
      totalReports,
      avgRating,
      recentReports,
      status: recentReports > 0 ? 'active' : 'inactive'
    }
  }

  const getLecturerMetrics = (lecturerId) => {
    const lecturerCourses = assignments.filter(a => a.lecturer_id === lecturerId)
    const lecturerReports = reports.filter(r => r.lecturer_id === lecturerId)
    const lecturerRatings = ratings.filter(r => r.lecturer_id === lecturerId)
    
    const avgRating = lecturerRatings.length > 0
      ? (lecturerRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / lecturerRatings.length).toFixed(1)
      : 0
    
    const recentReports = lecturerReports.filter(report => {
      const reportDate = new Date(report.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return reportDate > weekAgo
    }).length

    return {
      totalCourses: lecturerCourses.length,
      totalReports: lecturerReports.length,
      totalRatings: lecturerRatings.length,
      avgRating,
      recentReports,
      performance: avgRating >= 4.0 ? 'excellent' : avgRating >= 3.0 ? 'good' : 'needs_attention'
    }
  }

  const getPerformanceStatus = (metrics) => {
    if (metrics.avgRating >= 4.5) return 'excellent'
    if (metrics.avgRating >= 4.0) return 'good'
    if (metrics.avgRating >= 3.0) return 'fair'
    return 'needs_attention'
  }

  const exportMonitoringData = () => {
    const workbook = XLSX.utils.book_new()
    
    const coursesData = courses.map(c => {
      const metrics = getCourseMetrics(c.id)
      return {
        'Course Code': c.course_code,
        'Course Name': c.course_name,
        'Faculty': c.faculty_name,
        'Stream': c.stream_id,
        'Students': c.total_registered_students || 0,
        'Total Reports': metrics.totalReports,
        'Recent Reports': metrics.recentReports,
        'Avg Rating': metrics.avgRating,
        'Status': c.status,
        'Activity': metrics.status
      }
    })
    const coursesSheet = XLSX.utils.json_to_sheet(coursesData)
    XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses')
    
    const lecturersData = lecturers.map(l => {
      const metrics = getLecturerMetrics(l.id)
      return {
        'Name': l.full_name,
        'Email': l.email,
        'Staff ID': l.staff_student_id,
        'Department': l.department || 'General',
        'Total Courses': metrics.totalCourses,
        'Total Reports': metrics.totalReports,
        'Total Ratings': metrics.totalRatings,
        'Recent Reports': metrics.recentReports,
        'Avg Rating': metrics.avgRating,
        'Performance': metrics.performance
      }
    })
    const lecturersSheet = XLSX.utils.json_to_sheet(lecturersData)
    XLSX.utils.book_append_sheet(workbook, lecturersSheet, 'Lecturers')

    const ratingsSummary = [{
      'Total Ratings': ratings.length,
      'Average Rating': avgRating,
      '5-Star Ratings': ratings.filter(r => r.rating === 5).length,
      'Positive Ratings (4+ Stars)': ratings.filter(r => r.rating >= 4).length,
      'Export Date': new Date().toLocaleDateString()
    }]
    const ratingsSheet = XLSX.utils.json_to_sheet(ratingsSummary)
    XLSX.utils.book_append_sheet(workbook, ratingsSheet, 'Summary')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `pl_monitoring_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const totalStudents = courses.reduce((sum, c) => sum + (c.total_registered_students || 0), 0)
  const totalReports = reports.length
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratings.length).toFixed(1)
    : "0.0"

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
        <div className="pl-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="pl-icon">
                  <Eye size={48} />
                </div>
                <div>
                  <h1 className="pl-title mb-1">System Monitoring</h1>
                  <p className="pl-subtitle mb-0">Monitor courses, lecturers, and academic performance</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportMonitoringData}
                className="btn btn-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="pl-stat-card pl-stat-orange">
              <div className="stat-icon-bg">
                <BookOpen size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{courses.length}</div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>All Programs</span>
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
                <div className="stat-value">{lecturers.length}</div>
                <div className="stat-label">Lecturers</div>
                <div className="stat-trend">
                  <Award size={16} />
                  <span>Faculty</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="pl-stat-card pl-stat-green">
              <div className="stat-icon-bg">
                <BarChart3 size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalReports}</div>
                <div className="stat-label">Reports</div>
                <div className="stat-trend">
                  <Clock size={16} />
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
                  <TrendingUp size={16} />
                  <span>Performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pl-card mb-4">
          <div className="card-body">
            <div className="nav-tabs-pl">
              <button 
                onClick={() => setView('courses')} 
                className={`nav-tab-pl ${view === 'courses' ? 'active' : ''}`}
              >
                <BookOpen size={18} className="me-2" />
                Courses Monitoring
              </button>
              <button 
                onClick={() => setView('lecturers')} 
                className={`nav-tab-pl ${view === 'lecturers' ? 'active' : ''}`}
              >
                <Users size={18} className="me-2" />
                Lecturers Performance
              </button>
              <button 
                onClick={() => setView('ratings')} 
                className={`nav-tab-pl ${view === 'ratings' ? 'active' : ''}`}
              >
                <Award size={18} className="me-2" />
                Ratings Overview
              </button>
            </div>
          </div>
        </div>

        {view === 'courses' && (
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-orange">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Course Performance Monitoring</h3>
                  <p className="pl-card-subtitle mb-0">Track course activities and performance metrics</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-orange">{courses.length} courses</span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="pl-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Faculty</th>
                        <th>Stream</th>
                        <th>Students</th>
                        <th>Reports</th>
                        <th>Avg Rating</th>
                        <th>Activity</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => {
                        const metrics = getCourseMetrics(course.id)
                        const performanceStatus = getPerformanceStatus(metrics)
                        
                        return (
                          <tr key={course.id}>
                            <td>
                              <span className="course-code-pl">{course.course_code}</span>
                            </td>
                            <td style={{ fontWeight: '600' }}>{course.course_name}</td>
                            <td>{course.faculty_name}</td>
                            <td>
                              <span className="stream-badge">{course.stream_id}</span>
                            </td>
                            <td>
                              <span className="students-count">{course.total_registered_students || 0}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <BarChart3 size={14} className="text-muted" />
                                <span>{metrics.totalReports}</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Star size={14} fill={metrics.avgRating > 0 ? "#ffc107" : "none"} color="#ffc107" />
                                <span style={{ fontWeight: '700' }}>{metrics.avgRating}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge-pl ${metrics.status}`}>
                                {metrics.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <span className={`performance-badge-pl ${performanceStatus}`}>
                                {performanceStatus === 'excellent' && 'Excellent'}
                                {performanceStatus === 'good' && 'Good'}
                                {performanceStatus === 'fair' && 'Fair'}
                                {performanceStatus === 'needs_attention' && 'Needs Attention'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'lecturers' && (
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-blue">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Lecturers Performance</h3>
                  <p className="pl-card-subtitle mb-0">Monitor faculty performance and activities</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-blue">{lecturers.length} lecturers</span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="lecturers-grid">
                  {lecturers.map((lecturer) => {
                    const metrics = getLecturerMetrics(lecturer.id)
                    
                    return (
                      <div key={lecturer.id} className="lecturer-monitoring-card">
                        <div className="lecturer-header-pl">
                          <div className="lecturer-avatar-pl">
                            {lecturer.full_name?.charAt(0) || 'L'}
                          </div>
                          <div className="lecturer-info-pl">
                            <h5 className="lecturer-name-pl">{lecturer.full_name}</h5>
                            <p className="lecturer-email-pl">{lecturer.email}</p>
                            <div className="lecturer-meta-pl">
                              <span>Staff ID: {lecturer.staff_student_id}</span>
                              <span>{lecturer.department || 'General'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="lecturer-metrics-pl">
                          <div className="metric-row-pl">
                            <div className="metric-pl">
                              <div className="metric-value-pl">{metrics.totalCourses}</div>
                              <div className="metric-label-pl">Courses</div>
                            </div>
                            <div className="metric-pl">
                              <div className="metric-value-pl">{metrics.totalReports}</div>
                              <div className="metric-label-pl">Reports</div>
                            </div>
                            <div className="metric-pl">
                              <div className="metric-value-pl">{metrics.totalRatings}</div>
                              <div className="metric-label-pl">Ratings</div>
                            </div>
                          </div>
                          
                          <div className="performance-section-pl">
                            <div className="rating-display-pl">
                              <Star size={16} fill="#ffc107" color="#ffc107" />
                              <span className="rating-value-pl">{metrics.avgRating}</span>
                              <span className="rating-max-pl">/5</span>
                            </div>
                            <div className={`performance-tag-pl ${metrics.performance}`}>
                              {metrics.performance === 'excellent' && <CheckCircle size={14} />}
                              {metrics.performance === 'good' && <TrendingUp size={14} />}
                              {metrics.performance === 'needs_attention' && <AlertCircle size={14} />}
                              <span>
                                {metrics.performance === 'excellent' && 'Excellent'}
                                {metrics.performance === 'good' && 'Good'}
                                {metrics.performance === 'needs_attention' && 'Needs Attention'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'ratings' && (
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-yellow">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Ratings Overview</h3>
                  <p className="pl-card-subtitle mb-0">Student feedback and rating distribution</p>
                </div>
              </div>
              <span className="pl-badge pl-badge-yellow">{ratings.length} ratings</span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="row">
                  <div className="col-lg-6">
                    <div className="ratings-distribution-pl">
                      <h5 className="mb-4">Rating Distribution</h5>
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratings.filter(r => r.rating === star).length
                        const percentage = ratings.length > 0 ? (count / ratings.length * 100).toFixed(0) : 0
                        
                        return (
                          <div key={star} className="distribution-item-pl">
                            <div className="distribution-header-pl">
                              <div className="star-label-pl">
                                <span>{star} Star</span>
                                <div className="stars-small-pl">
                                  {[...Array(star)].map((_, i) => (
                                    <Star key={i} size={12} fill="#ffc107" color="#ffc107" />
                                  ))}
                                </div>
                              </div>
                              <span className="distribution-count-pl">{count}</span>
                            </div>
                            <div className="distribution-bar-pl">
                              <div 
                                className="distribution-fill-pl"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="distribution-percentage-pl">{percentage}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="col-lg-6">
                    <div className="ratings-stats-pl">
                      <h5 className="mb-4">Quick Stats</h5>
                      <div className="stats-grid-pl">
                        <div className="stat-item-pl">
                          <div className="stat-value-pl">{ratings.length}</div>
                          <div className="stat-label-pl">Total Ratings</div>
                        </div>
                        <div className="stat-item-pl">
                          <div className="stat-value-pl">{avgRating}</div>
                          <div className="stat-label-pl">Average Rating</div>
                        </div>
                        <div className="stat-item-pl">
                          <div className="stat-value-pl">
                            {ratings.filter(r => r.rating >= 4).length}
                          </div>
                          <div className="stat-label-pl">Positive (4+ Stars)</div>
                        </div>
                        <div className="stat-item-pl">
                          <div className="stat-value-pl">
                            {ratings.length > 0 ? Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100) : 0}%
                          </div>
                          <div className="stat-label-pl">Satisfaction Rate</div>
                        </div>
                      </div>
                      
                      <div className="recent-ratings-pl mt-4">
                        <h6 className="mb-3">Recent Feedback</h6>
                        <div className="ratings-list-pl">
                          {ratings.slice(0, 5).map(rating => (
                            <div key={rating.id} className="rating-item-pl">
                              <div className="rating-header-pl">
                                <div className="rating-stars-pl">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      fill={i < rating.rating ? "#ffc107" : "none"}
                                      color="#ffc107"
                                    />
                                  ))}
                                </div>
                                <span className="rating-date-pl">
                                  {new Date(rating.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {rating.comment && (
                                <p className="rating-comment-pl">"{rating.comment}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  )
}