// src/Pages/PL/PLReports.jsx
import { useEffect, useState } from "react"
import api from "../../Api/api"
import Dashboard from "../../Components/Dashboard"
import "../../CSS/Dashboard.css"
import "../../CSS/PL.css"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { FileText, Download, Search, Filter, Calendar, Users, Eye } from "lucide-react"

export default function ReportsPL() {
  const [user, setUser] = useState(null)
  const [reports, setReports] = useState([])
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [filterLecturer, setFilterLecturer] = useState("all")
  const [selectedReport, setSelectedReport] = useState(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      fetchData()
    }
  }, [])

  async function fetchData() {
    try {
      const rRes = await api.get("/reports")
      setReports(rRes.data)
      
      const cRes = await api.get("/courses")
      setCourses(cRes.data)

      const lRes = await api.get("/users")
      setLecturers(lRes.data.filter(u => u.role === "lecturer"))
    } catch (err) {
      console.error(err)
    }
  }

  const exportAllReports = () => {
    const data = reports.map(report => {
      const course = courses.find(c => c.id === report.course_id)
      const lecturer = lecturers.find(l => l.id === report.lecturer_id)
      return {
        'Report ID': report.id,
        'Lecturer': lecturer?.full_name || report.lecturer_id,
        'Course Code': course?.course_code,
        'Course Name': course?.course_name,
        'Week': report.week_of_reporting,
        'Date': new Date(report.date_of_lecture).toLocaleDateString(),
        'Students Present': report.actual_students_present,
        'Venue': report.venue,
        'Topic': report.topic_taught,
        'Learning Outcomes': report.learning_outcomes,
        'Recommendations': report.recommendations
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Reports')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `all_reports_${new Date().toISOString().split('T')[0]}.xlsx`)
    setMessage("✅ Reports exported successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const downloadReport = (report) => {
    const course = courses.find(c => c.id === report.course_id)
    const lecturer = lecturers.find(l => l.id === report.lecturer_id)
    const text = `LECTURE REPORT\n\nReport ID: ${report.id}\nLecturer: ${lecturer?.full_name || report.lecturer_id}\nCourse: ${course?.course_name}\nWeek: ${report.week_of_reporting}\nDate: ${new Date(report.date_of_lecture).toLocaleDateString()}\nStudents Present: ${report.actual_students_present}\nVenue: ${report.venue}\nScheduled Time: ${report.scheduled_time}\n\nTopic Taught:\n${report.topic_taught}\n\nLearning Outcomes:\n${report.learning_outcomes}\n\nRecommendations:\n${report.recommendations}`
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${report.id}.txt`
    a.click()
  }

  // Get unique courses and lecturers from reports
  const reportedCourses = ["all", ...new Set(
    reports.map(r => {
      const course = courses.find(c => c.id === r.course_id)
      return course?.course_name
    }).filter(Boolean)
  )]

  const reportingLecturers = ["all", ...new Set(
    reports.map(r => {
      const lecturer = lecturers.find(l => l.id === r.lecturer_id)
      return lecturer?.full_name
    }).filter(Boolean)
  )]

  // Filter reports
  const filteredReports = reports.filter(r => {
    const course = courses.find(c => c.id === r.course_id)
    const lecturer = lecturers.find(l => l.id === r.lecturer_id)
    
    const matchesSearch = 
      (course?.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       course?.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
       r.topic_taught?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCourse = filterCourse === "all" || course?.course_name === filterCourse
    const matchesLecturer = filterLecturer === "all" || lecturer?.full_name === filterLecturer
    
    return matchesSearch && matchesCourse && matchesLecturer
  })

  // Calculate this week's reports
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const thisWeekReports = reports.filter(r => new Date(r.date_of_lecture) >= oneWeekAgo).length

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
        {/* Page Header */}
        <div className="pl-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="pl-icon">
                  <FileText size={48} />
                </div>
                <div>
                  <h1 className="pl-title mb-1">Lecturer Reports</h1>
                  <p className="pl-subtitle mb-0">View and manage all lecture reports</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportAllReports}
                className="btn btn-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export All Reports
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - 3 cards */}
        <div className="row g-4 mb-4">
          <div className="col-sm-6 col-md-4">
            <div className="pl-stat-card pl-stat-green">
              <div className="stat-icon-bg">
                <FileText size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{filteredReports.length}</div>
                <div className="stat-label">Total Reports</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="pl-stat-card pl-stat-blue">
              <div className="stat-icon-bg">
                <Calendar size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{thisWeekReports}</div>
                <div className="stat-label">This Week</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="pl-stat-card pl-stat-orange">
              <div className="stat-icon-bg">
                <Users size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{new Set(reports.map(r => r.lecturer_id)).size}</div>
                <div className="stat-label">Active Lecturers</div>
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

        {/* Search and Filters */}
        <div className="pl-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by course, code, or topic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="pl-input"
                >
                  <option value="all">All Courses</option>
                  {reportedCourses.slice(1).map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  value={filterLecturer}
                  onChange={(e) => setFilterLecturer(e.target.value)}
                  className="pl-input"
                >
                  <option value="all">All Lecturers</option>
                  {reportingLecturers.slice(1).map(lecturer => (
                    <option key={lecturer} value={lecturer}>{lecturer}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="pl-card">
          <div className="pl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon header-icon-green">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="pl-card-title mb-0">All Reports</h3>
                <p className="pl-card-subtitle mb-0">Lecture reports from faculty</p>
              </div>
            </div>
            <span className="pl-badge pl-badge-green">
              Showing {filteredReports.length} of {reports.length}
            </span>
          </div>
          <div className="card-body p-0">
            {filteredReports.length > 0 ? (
              <div className="table-responsive">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Lecturer</th>
                      <th>Course</th>
                      <th>Week</th>
                      <th>Date</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => {
                      const course = courses.find(c => c.id === r.course_id)
                      const lecturer = lecturers.find(l => l.id === r.lecturer_id)
                      return (
                        <tr key={r.id}>
                          <td>
                            <span className="report-id">#{r.id}</span>
                          </td>
                          <td>{lecturer?.full_name || `ID: ${r.lecturer_id}`}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{course?.course_code}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>{course?.course_name}</div>
                          </td>
                          <td>
                            <span className="week-badge">Week {r.week_of_reporting}</span>
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>
                            {new Date(r.date_of_lecture).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="students-count">{r.actual_students_present}</span>
                          </td>
                          <td>
                            <button 
                              onClick={() => setSelectedReport(r)}
                              className="btn btn-sm btn-outline-primary me-2"
                            >
                              <Eye size={14} className="me-1" />
                              View
                            </button>
                            <button 
                              onClick={() => downloadReport(r)}
                              className="btn btn-sm btn-outline-success"
                            >
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-table">
                <FileText size={64} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {searchTerm || filterCourse !== "all" || filterLecturer !== "all"
                    ? "No reports match your filters"
                    : "No reports available"}
                </h5>
                <p className="text-muted small">
                  {searchTerm || filterCourse !== "all" || filterLecturer !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Reports will appear here once lecturers submit them"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FileText size={20} className="me-2" />
                    Report #{selectedReport.id}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setSelectedReport(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <strong>Lecturer:</strong> {lecturers.find(l => l.id === selectedReport.lecturer_id)?.full_name}
                    </div>
                    <div className="col-md-6">
                      <strong>Course:</strong> {courses.find(c => c.id === selectedReport.course_id)?.course_name}
                    </div>
                    <div className="col-md-4">
                      <strong>Week:</strong> {selectedReport.week_of_reporting}
                    </div>
                    <div className="col-md-4">
                      <strong>Date:</strong> {new Date(selectedReport.date_of_lecture).toLocaleDateString()}
                    </div>
                    <div className="col-md-4">
                      <strong>Students:</strong> {selectedReport.actual_students_present}
                    </div>
                    <div className="col-md-6">
                      <strong>Venue:</strong> {selectedReport.venue}
                    </div>
                    <div className="col-md-6">
                      <strong>Time:</strong> {selectedReport.scheduled_time}
                    </div>
                  </div>
                  <hr />
                  <div className="mb-3">
                    <strong>Topic Taught:</strong>
                    <p className="mt-2">{selectedReport.topic_taught}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Learning Outcomes:</strong>
                    <p className="mt-2">{selectedReport.learning_outcomes || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Recommendations:</strong>
                    <p className="mt-2">{selectedReport.recommendations || 'N/A'}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    onClick={() => downloadReport(selectedReport)}
                    className="btn btn-success"
                  >
                    <Download size={16} className="me-2" />
                    Download Report
                  </button>
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  )
}