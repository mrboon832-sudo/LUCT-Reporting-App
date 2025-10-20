import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from '../../Api/api';
import Dashboard from '../../Components/Dashboard';
import '../../CSS/Dashboard.css'; 
import "../../CSS/PRL.css";
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import {
  BookOpen,
  FileText,
  Star,
  Users,
  Layers,
  ClipboardList,
  Download,
  TrendingUp,
  Award,
  BarChart3,
} from "lucide-react"

export default function DashboardPRL() {
  const [user, setUser] = useState(null)
  const [streamCourses, setStreamCourses] = useState([])
  const [reports, setReports] = useState([])
  const [ratings, setRatings] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      fetchData(parsed.id)
    }
  }, [])

  async function fetchData(prlId) {
    setLoading(true)
    try {
      const streamsRes = await api.get("/streams")
      const myStream = streamsRes.data.find((s) => s.prl_id === prlId)

      if (!myStream) {
        setLoading(false)
        return
      }

      const [coursesRes, reportsRes, ratingsRes, lecturersRes] = await Promise.all([
        api.get("/courses"),
        api.get("/reports"),
        api.get("/ratings"),
        api.get("/users")
      ])

      const filteredCourses = coursesRes.data.filter(
        (c) => c.stream_id === myStream.id
      )
      setStreamCourses(filteredCourses)
      setReports(reportsRes.data)
      setRatings(ratingsRes.data)
      setLecturers(lecturersRes.data.filter(u => u.role === "lecturer"))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getLecturerName = (lecturerId) => {
    const lecturer = lecturers.find(l => l.id === lecturerId)
    return lecturer ? lecturer.full_name : 'Not Assigned'
  }

  const exportDashboardData = async () => {
    try {
      setExportLoading(true)
      
      const workbook = XLSX.utils.book_new()
      
      const coursesData = streamCourses.map(course => {
        const courseReports = reports.filter(r => r.course_id === course.id)
        const courseRatings = ratings.filter(r => r.course_id === course.id)
        const avgRating = courseRatings.length > 0
          ? (courseRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / courseRatings.length).toFixed(1)
          : 0
        
        return {
          'Course Code': course.course_code,
          'Course Name': course.course_name,
          'Faculty': course.faculty_name,
          'Stream ID': course.stream_id,
          'Lecturer': getLecturerName(course.lecturer_id),
          'Total Students': course.total_registered_students || 0,
          'Total Reports': courseReports.length,
          'Average Rating': avgRating,
          'Status': course.status,
          'Credits': course.credits || 'N/A'
        }
      })
      
      if (coursesData.length > 0) {
        const coursesSheet = XLSX.utils.json_to_sheet(coursesData)
        XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses')
      }
      
      const reportsData = reports.map(report => {
        const course = streamCourses.find(c => c.id === report.course_id)
        return {
          'Report ID': report.id,
          'Course': course?.course_name || 'Unknown Course',
          'Lecturer': getLecturerName(report.lecturer_id),
          'Week': report.week_of_reporting,
          'Date': report.date_of_lecture ? new Date(report.date_of_lecture).toLocaleDateString() : 'N/A',
          'Students Present': report.actual_students_present || 0,
          'Topic': report.topic_taught || 'Not specified',
          'Venue': report.venue || 'Not specified',
          'Status': report.reviewed ? 'Reviewed' : 'Pending Review'
        }
      })
      
      if (reportsData.length > 0) {
        const reportsSheet = XLSX.utils.json_to_sheet(reportsData)
        XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Reports')
      }
      
      const ratingsData = ratings.map(rating => {
        const course = streamCourses.find(c => c.id === rating.course_id)
        return {
          'Rating ID': rating.id,
          'Course': course?.course_name || 'Unknown Course',
          'Lecturer': getLecturerName(rating.lecturer_id),
          'Rating': rating.rating,
          'Comment': rating.comment || 'No comment',
          'Date': new Date(rating.created_at).toLocaleDateString()
        }
      })
      
      if (ratingsData.length > 0) {
        const ratingsSheet = XLSX.utils.json_to_sheet(ratingsData)
        XLSX.utils.book_append_sheet(workbook, ratingsSheet, 'Ratings')
      }
      
      const lecturersData = lecturers.map(lecturer => {
        const lecturerCourses = streamCourses.filter(course => course.lecturer_id === lecturer.id)
        const lecturerReports = reports.filter(r => r.lecturer_id === lecturer.id)
        const lecturerRatings = ratings.filter(r => r.lecturer_id === lecturer.id)
        const avgRating = lecturerRatings.length > 0
          ? (lecturerRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / lecturerRatings.length).toFixed(1)
          : 0
        
        return {
          'Name': lecturer.full_name,
          'Email': lecturer.email,
          'Staff ID': lecturer.staff_student_id,
          'Department': lecturer.department || 'General',
          'Total Courses': lecturerCourses.length,
          'Total Reports': lecturerReports.length,
          'Total Ratings': lecturerRatings.length,
          'Average Rating': avgRating,
          'Total Students': lecturerCourses.reduce((sum, course) => sum + (course.total_registered_students || 0), 0)
        }
      })
      
      if (lecturersData.length > 0) {
        const lecturersSheet = XLSX.utils.json_to_sheet(lecturersData)
        XLSX.utils.book_append_sheet(workbook, lecturersSheet, 'Lecturers')
      }
      
      const summaryData = [{
        'Total Courses': streamCourses.length,
        'Total Lecturers': lecturers.length,
        'Total Reports': reports.length,
        'Total Ratings': ratings.length,
        'Average Rating': avgRating,
        'Pending Reviews': reports.filter(r => !r.reviewed).length,
        'Export Date': new Date().toLocaleDateString(),
        'PRL Name': user?.full_name,
        'PRL ID': user?.staff_student_id
      }]
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const dataBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const fileName = `prl_dashboard_${user?.staff_student_id}_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(dataBlob, fileName)
      
    } catch (err) {
      console.error("Error exporting data:", err)
      alert("Failed to export data. Please try again.")
    } finally {
      setExportLoading(false)
    }
  }

  const totalCourses = streamCourses.length
  const totalReports = reports.length
  const totalRatings = ratings.length
  const totalLecturers = new Set(streamCourses.map((c) => c.lecturer_id)).size || 0
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratings.length).toFixed(1)
    : "0.0"

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <Dashboard user={user}>
      <div className="prl-dashboard">
        <div className="prl-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="prl-icon">
                  <Layers size={48} />
                </div>
                <div>
                  <h1 className="prl-title mb-1">Principal Lecturer Dashboard</h1>
                  <p className="prl-subtitle mb-0">Monitor and review academic programs and faculty performance</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportDashboardData}
                disabled={exportLoading}
                className="btn btn-light btn-lg shadow-sm d-flex align-items-center"
              >
                {exportLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Exporting...</span>
                    </div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={20} className="me-2" />
                    Export All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-red">
              <div className="stat-icon-prl">
                <BookOpen size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalCourses}</div>
                <div className="stat-label">Stream Courses</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>Under Your Review</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-purple">
              <div className="stat-icon-prl">
                <Users size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalLecturers}</div>
                <div className="stat-label">Lecturers</div>
                <div className="stat-trend">
                  <Award size={16} />
                  <span>Active Faculty</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-orange">
              <div className="stat-icon-prl">
                <FileText size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{totalReports}</div>
                <div className="stat-label">Reports</div>
                <div className="stat-trend">
                  <BarChart3 size={16} />
                  <span>To Review</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-yellow">
              <div className="stat-icon-prl">
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

        <div className="prl-card mb-4 mt-7">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-red">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Recent Activity</h3>
                <p className="prl-card-subtitle mb-0">Latest reports and ratings</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="activity-list">
                {reports.slice(0, 8).map((report) => (
                  <div key={report.id} className="activity-item">
                    <div className="activity-icon">📊</div>
                    <div className="activity-content">
                      <div className="activity-title">New Report Submitted</div>
                      <div className="activity-meta">Lecturer ID: {report.lecturer_id} • Week {report.week_of_reporting}</div>
                    </div>
                    <div className="activity-time">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {ratings.slice(0, 4).map((rating) => (
                  <div key={rating.id} className="activity-item">
                    <div className="activity-icon">⭐</div>
                    <div className="activity-content">
                      <div className="activity-title">New Rating Received</div>
                      <div className="activity-meta">{rating.rating}/5 stars • Lecturer ID: {rating.lecturer_id}</div>
                    </div>
                    <div className="activity-time">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {reports.length === 0 && ratings.length === 0 && (
                  <div className="text-center py-4">
                    <ClipboardList size={48} className="text-muted mb-3" />
                    <p className="text-muted mb-0">No recent activity to display</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="prl-card mb-4">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-blue">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Quick Actions</h3>
                <p className="prl-card-subtitle mb-0">Frequently accessed features</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="quick-actions-grid">
              <Link to="/prl/reports" className="quick-action-btn">
                <div className="quick-action-icon">
                  <FileText size={24} />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Review Reports</div>
                  <div className="quick-action-subtitle">{reports.length} pending reviews</div>
                </div>
                <div className="quick-action-arrow">→</div>
              </Link>
              
              <Link to="/prl/courses" className="quick-action-btn">
                <div className="quick-action-icon">
                  <BookOpen size={24} />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">View Courses</div>
                  <div className="quick-action-subtitle">{streamCourses.length} courses in your stream</div>
                </div>
                <div className="quick-action-arrow">→</div>
              </Link>
              
              <Link to="monitoring" className="quick-action-btn">
                <div className="quick-action-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Monitor Performance</div>
                  <div className="quick-action-subtitle">Track academic metrics</div>
                </div>
                <div className="quick-action-arrow">→</div>
              </Link>
            </div>
          </div>
        </div>

        <div className="prl-card mb-4">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-yellow">
                <Star size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Ratings Distribution</h3>
                <p className="prl-card-subtitle mb-0">Overview of course ratings and feedback</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="ratings-distribution">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="rating-stats-card">
                      <div className="rating-stat-value">{avgRating}</div>
                      <div className="rating-stat-label">Average Rating</div>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={20} 
                            className={star <= avgRating ? "text-warning fill-warning" : "text-muted"} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="rating-stats-card">
                      <div className="rating-stat-value">{totalRatings}</div>
                      <div className="rating-stat-label">Total Ratings</div>
                      <div className="rating-meta">Across all courses</div>
                    </div>
                  </div>
                </div>
                
                {ratings.length > 0 && (
                  <div className="mt-4">
                    <h5 className="mb-3">Recent Ratings</h5>
                    <div className="recent-ratings-list">
                      {ratings.slice(0, 6).map((rating) => (
                        <div key={rating.id} className="recent-rating-item">
                          <div className="rating-info">
                            <div className="rating-stars-small">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  size={16} 
                                  className={star <= rating.rating ? "text-warning fill-warning" : "text-muted"} 
                                />
                              ))}
                            </div>
                            <span className="rating-value">{rating.rating}/5</span>
                          </div>
                          <div className="rating-meta">
                            Lecturer ID: {rating.lecturer_id} • {new Date(rating.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {ratings.length === 0 && (
                  <div className="text-center py-4">
                    <Star size={48} className="text-muted mb-3" />
                    <p className="text-muted mb-0">No ratings data available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="prl-card">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-green">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Performance Overview</h3>
                <p className="prl-card-subtitle mb-0">Key metrics and academic performance indicators</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="metric-card">
                  <div className="metric-value">{streamCourses.length}</div>
                  <div className="metric-label">Active Courses</div>
                  <div className="metric-trend text-success">
                    <TrendingUp size={16} />
                    <span>In your stream</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="metric-card">
                  <div className="metric-value">{reports.filter(r => !r.reviewed).length}</div>
                  <div className="metric-label">Pending Reviews</div>
                  <div className="metric-trend text-warning">
                    <FileText size={16} />
                    <span>Awaiting feedback</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="metric-card">
                  <div className="metric-value">{totalLecturers}</div>
                  <div className="metric-label">Faculty Members</div>
                  <div className="metric-trend text-info">
                    <Users size={16} />
                    <span>Under supervision</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  )
}