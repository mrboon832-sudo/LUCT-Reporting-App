import { useEffect, useState } from "react"
import api from '../../api/api';
import Dashboard from '../../Components/Dashboard'; 
import '../../CSS/Dashboard.css'; 
import "../../CSS/Lecturer.css";
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { BookOpen, FileText, Star, UserCircle, Download, Users, Award, AlertCircle, CheckCircle, Plus} from "lucide-react"

export default function Reports() {
  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [reports, setReports] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formData, setFormData] = useState({
    course_id: '',
    week_of_reporting: '',
    date_of_lecture: '',
    actual_students_present: '',
    topic_taught: '',
    venue: '',
    scheduled_time: '',
    learning_outcomes: '',
    recommendations: ''
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        fetchData(parsed.id)
      } catch (err) {
        console.error("Error parsing user data:", err)
        setError("Failed to load user data")
        setLoading(false)
      }
    } else {
      setError("No user data found")
      setLoading(false)
    }
  }, [])

  async function fetchData(lecturerId) {
    try {
      setLoading(true)
      setError(null)

      const [assignRes, allCourses, reportRes, ratingRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/courses"),
        api.get("/reports"),
        api.get("/ratings")
      ])

      const lecturerAssignments = assignRes.data.filter(
        (a) => a.lecturer_id === lecturerId
      )
      setAssignments(lecturerAssignments)
      setCourses(allCourses.data)

      const lecturerReports = reportRes.data.filter(
        (r) => r.lecturer_id === lecturerId
      )
      setReports(lecturerReports)

      const lecturerRatings = ratingRes.data.filter(
        (r) => r.lecturer_id === lecturerId
      )
      setRatings(lecturerRatings)

    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load dashboard data. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setSubmitError(null)
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
   
      if (!formData.course_id) {
        throw new Error('Please select a course')
      }
      if (!formData.week_of_reporting) {
        throw new Error('Please enter the week number')
      }
      if (!formData.date_of_lecture) {
        throw new Error('Please select the lecture date')
      }


      const selectedCourse = lecturerCourses.find(course => course.id === parseInt(formData.course_id))
      

      const reportData = {
        lecturer_id: user.id,
        course_id: parseInt(formData.course_id),
        class_name: selectedCourse?.course_name || 'Unknown Class',
        week_of_reporting: parseInt(formData.week_of_reporting),
        date_of_lecture: formData.date_of_lecture,
        actual_students_present: parseInt(formData.actual_students_present) || 0,
        venue: formData.venue || '',
        scheduled_time: formData.scheduled_time || 'To be scheduled',
        topic_taught: formData.topic_taught || '',
        learning_outcomes: formData.learning_outcomes || 'Standard learning outcomes achieved',
        recommendations: formData.recommendations || 'No specific recommendations'
      }

      console.log('Submitting report data to lecture_reports table:', reportData)

      const response = await api.post('/reports', reportData)
      
      console.log('Report submitted successfully:', response.data)
      
      setSubmitSuccess(true)
      

      setFormData({
        course_id: '',
        week_of_reporting: '',
        date_of_lecture: '',
        actual_students_present: '',
        topic_taught: '',
        venue: '',
        scheduled_time: '',
        learning_outcomes: '',
        recommendations: ''
      })


      setTimeout(() => {
        fetchData(user.id)
        setShowSubmitModal(false)
        setSubmitSuccess(false)
      }, 1500)

    } catch (err) {
      console.error('Error submitting report:', err)
      console.error('Error details:', err.response?.data)
      
      setSubmitError(err.response?.data?.error || err.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const closeModal = () => {
    if (!submitLoading) {
      setShowSubmitModal(false)
      setSubmitError(null)
      setSubmitSuccess(false)
      setFormData({
        course_id: '',
        week_of_reporting: '',
        date_of_lecture: '',
        actual_students_present: '',
        topic_taught: '',
        venue: '',
        scheduled_time: '',
        learning_outcomes: '',
        recommendations: ''
      })
    }
  }

  const exportAllMyDataToExcel = async () => {
    try {
      setExportLoading(true)
      
      const workbook = XLSX.utils.book_new()
      
      const coursesData = assignments.map(assignment => {
        const course = courses.find((c) => c.id === assignment.course_id)
        return {
          'Course Code': course?.course_code || 'N/A',
          'Course Name': course?.course_name || 'N/A',
          'Faculty': course?.faculty_name || 'N/A',
          'Stream ID': course?.stream_id || 'N/A',
          'Total Students': course?.total_registered_students || 0,
          'Status': course?.status || 'Unknown'
        }
      })
      
      if (coursesData.length > 0) {
        const coursesWorksheet = XLSX.utils.json_to_sheet(coursesData)
        XLSX.utils.book_append_sheet(workbook, coursesWorksheet, 'My Courses')
      }
      
 
      const reportsData = reports.map(report => {
        const course = courses.find((c) => c.id === report.course_id)
        return {
          'Report ID': report.id,
          'Course': course?.course_name || 'Unknown Course',
          'Week': report.week_of_reporting,
          'Date': report.date_of_lecture ? new Date(report.date_of_lecture).toLocaleDateString() : 'N/A',
          'Students Present': report.actual_students_present || 0,
          'Topic': report.topic_taught || 'Not specified',
          'Venue': report.venue || 'Not specified',
          'Class Name': report.class_name || 'Not specified',
          'Scheduled Time': report.scheduled_time || 'Not specified',
          'Learning Outcomes': report.learning_outcomes || 'Not specified',
          'Recommendations': report.recommendations || 'Not specified'
        }
      })
      
      if (reportsData.length > 0) {
        const reportsWorksheet = XLSX.utils.json_to_sheet(reportsData)
        XLSX.utils.book_append_sheet(workbook, reportsWorksheet, 'My Reports')
      }

      const ratingsData = ratings.map(rating => {
        const course = courses.find((c) => c.id === rating.course_id)
        return {
          'Rating ID': rating.id,
          'Course': course?.course_name || 'Unknown Course',
          'Rating': rating.rating,
          'Comment': rating.comment || 'No comment'
        }
      })
      
      if (ratingsData.length > 0) {
        const ratingsWorksheet = XLSX.utils.json_to_sheet(ratingsData)
        XLSX.utils.book_append_sheet(workbook, ratingsWorksheet, 'My Ratings')
      }
      
  
      const summaryData = [{
        'Total Courses': assignments.length,
        'Total Reports': reports.length,
        'Total Ratings': ratings.length,
        'Average Rating': avgRating,
        'Total Students': totalStudents,
        'Export Date': new Date().toLocaleDateString(),
        'Lecturer': user?.full_name || 'Unknown',
        'Lecturer ID': user?.staff_student_id || 'Unknown'
      }]
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const dataBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const fileName = `lecturer_dashboard_${user?.staff_student_id}_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(dataBlob, fileName)
      
    } catch (err) {
      console.error("Error exporting data:", err)
      setError("Failed to export data. Please try again.")
    } finally {
      setExportLoading(false)
    }
  }

  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + parseFloat(r.rating || 0), 0) / ratings.length).toFixed(1)
    : "N/A"
  
  const totalStudents = assignments.reduce((sum, a) => {
    const course = courses.find(c => c.id === a.course_id)
    return sum + (parseInt(course?.total_registered_students) || 0)
  }, 0)

  const lecturerCourses = assignments.map(a => {
    const course = courses.find(c => c.id === a.course_id)
    return course
  }).filter(Boolean)

  if (loading) {
    return (
      <Dashboard user={user}>
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Dashboard>
    )
  }

  if (error) {
    return (
      <Dashboard user={user}>
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <AlertCircle className="me-2" size={24} />
          <div>{error}</div>
          <button 
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </Dashboard>
    )
  }

  return (
    <Dashboard user={user}>
      <div className="lecturer-dashboard">

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
                disabled={exportLoading}
                className="btn btn-light btn-lg shadow-sm d-flex align-items-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Exporting...</span>
                    </div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Export All Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
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
                {ratings.length > 0 && (
                  <div className="stat-subtext">{ratings.length} ratings</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My Courses Section */}
        <div className="modern-card mb-4">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <BookOpen size={24} className="text-success" />
              <h3 className="card-title-modern mb-0">My Courses</h3>
            </div>
            <span className="badge bg-success-subtle text-success">{assignments.length} courses</span>
          </div>
          <div className="card-body">
            {assignments.length > 0 ? (
              <div className="row g-3">
                {assignments.map((a) => {
                  const course = courses.find((c) => c.id === a.course_id)
                  const courseReports = reports.filter(r => r.course_id === a.course_id)
                  
                  return (
                    <div key={a.id} className="col-md-4">
                      <div className="course-card">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="course-code">{course?.course_code || 'N/A'}</span>
                          <span className="badge bg-primary-subtle text-primary">
                            {course?.total_registered_students || 0} students
                          </span>
                        </div>
                        <h5 className="course-title">{course?.course_name || 'Unknown Course'}</h5>
                        <p className="course-faculty">{course?.faculty_name || 'N/A'}</p>
                        <div className="course-meta">
                          <span className="reports-count">
                            <FileText size={14} className="me-1" />
                            {courseReports.length} reports
                          </span>
                          {course?.status && (
                            <span className={`status-badge status-${course.status.toLowerCase()}`}>
                              {course.status}
                            </span>
                          )}
                        </div>
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

        {/* Recent Reports Section */}
        <div className="modern-card mb-4">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <FileText size={24} className="text-warning" />
              <h3 className="card-title-modern mb-0">Recent Reports</h3>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning-subtle text-warning">{reports.length} reports</span>
              <button 
                className="btn btn-success btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowSubmitModal(true)}
                disabled={assignments.length === 0}
              >
                <Plus size={16} />
                Submit Report
              </button>
            </div>
          </div>
          <div className="card-body">
            {reports.length > 0 ? (
              <div className="row g-4">
                {reports.slice(0, 6).map((r) => {
                  const course = courses.find((c) => c.id === r.course_id)
                  return (
                    <div key={r.id} className="col-lg-4 col-md-6">
                      <div className="report-card">
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div className="report-icon">
                            <FileText size={24} />
                          </div>
                          <div className="report-content">
                            <h6 className="report-title">
                              {course?.course_name || 'Unknown Course'}
                            </h6>
                            <span className="badge bg-primary-subtle text-primary mb-2">
                              {course?.course_code || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="report-details">
                          <div className="detail-item">
                            <span className="detail-label">Week:</span>
                            <span className="detail-value">{r.week_of_reporting}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">
                              {r.date_of_lecture ? new Date(r.date_of_lecture).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Students Present:</span>
                            <span className="detail-value">{r.actual_students_present || 0}</span>
                          </div>
                          {r.topic_taught && (
                            <div className="detail-item">
                              <span className="detail-label">Topic:</span>
                              <span className="detail-value topic-text">{r.topic_taught}</span>
                            </div>
                          )}
                          {r.class_name && (
                            <div className="detail-item">
                              <span className="detail-label">Class:</span>
                              <span className="detail-value">{r.class_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No reports yet</h5>
                <p className="text-muted small mb-3">Your submitted reports will appear here</p>
                <button 
                  className="btn btn-success"
                  onClick={() => setShowSubmitModal(true)}
                  disabled={assignments.length === 0}
                >
                  <Plus size={16} className="me-2" />
                  Submit Your First Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Student Ratings Section */}
        <div className="modern-card mb-4">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <Star size={24} className="text-warning" />
              <h3 className="card-title-modern mb-0">Student Ratings</h3>
            </div>
            <span className="badge bg-warning-subtle text-warning">{ratings.length} ratings</span>
          </div>
          <div className="card-body">
            {ratings.length > 0 ? (
              <div className="row g-4">
                {ratings.slice(0, 6).map((r) => {
                  const course = courses.find((c) => c.id === r.course_id)
                  return (
                    <div key={r.id} className="col-lg-4 col-md-6">
                      <div className="rating-card">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <span className="badge bg-success-subtle text-success mb-2">
                              {course?.course_code || 'N/A'}
                            </span>
                            <h6 className="rating-course-title">
                              {course?.course_name || 'Unknown Course'}
                            </h6>
                          </div>
                        </div>
                        
                        <div className="rating-display mb-3">
                          <div className="stars-container">
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
                          <span className="rating-value">
                            {r.rating}/5
                          </span>
                        </div>

                        <p className="rating-comment">
                          "{r.comment || 'No comment provided'}"
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Award size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No ratings yet</h5>
                <p className="text-muted small mb-0">Student ratings will appear here once submitted</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Report Modal */}
        {showSubmitModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title d-flex align-items-center gap-2">
                    <FileText size={24} />
                    Submit New Report
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeModal}
                    disabled={submitLoading}
                  ></button>
                </div>

                <form onSubmit={handleSubmitReport}>
                  <div className="modal-body">
                    {submitError && (
                      <div className="alert alert-danger d-flex align-items-center mb-3">
                        <AlertCircle size={20} className="me-2" />
                        {submitError}
                      </div>
                    )}

                    {submitSuccess && (
                      <div className="alert alert-success d-flex align-items-center mb-3">
                        <CheckCircle size={20} className="me-2" />
                        Report submitted successfully!
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          Course <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="course_id"
                          value={formData.course_id}
                          onChange={handleFormChange}
                          required
                          disabled={submitLoading}
                        >
                          <option value="">Select a course</option>
                          {lecturerCourses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.course_code} - {course.course_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">
                          Week <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="week_of_reporting"
                          value={formData.week_of_reporting}
                          onChange={handleFormChange}
                          min="1"
                          max="52"
                          required
                          disabled={submitLoading}
                          placeholder="1-52"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">
                          Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="date_of_lecture"
                          value={formData.date_of_lecture}
                          onChange={handleFormChange}
                          required
                          disabled={submitLoading}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Students Present</label>
                        <input
                          type="number"
                          className="form-control"
                          name="actual_students_present"
                          value={formData.actual_students_present}
                          onChange={handleFormChange}
                          min="0"
                          disabled={submitLoading}
                          placeholder="Number of students"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Venue</label>
                        <input
                          type="text"
                          className="form-control"
                          name="venue"
                          value={formData.venue}
                          onChange={handleFormChange}
                          disabled={submitLoading}
                          placeholder="e.g., Lecture Hall A"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Scheduled Time</label>
                        <input
                          type="text"
                          className="form-control"
                          name="scheduled_time"
                          value={formData.scheduled_time}
                          onChange={handleFormChange}
                          disabled={submitLoading}
                          placeholder="e.g., 9:00 AM - 10:30 AM"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Topic Taught</label>
                        <textarea
                          className="form-control"
                          name="topic_taught"
                          value={formData.topic_taught}
                          onChange={handleFormChange}
                          rows="3"
                          disabled={submitLoading}
                          placeholder="Describe the topic covered in this lecture..."
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Learning Outcomes</label>
                        <textarea
                          className="form-control"
                          name="learning_outcomes"
                          value={formData.learning_outcomes}
                          onChange={handleFormChange}
                          rows="3"
                          disabled={submitLoading}
                          placeholder="What students should be able to do after this lecture..."
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Recommendations</label>
                        <textarea
                          className="form-control"
                          name="recommendations"
                          value={formData.recommendations}
                          onChange={handleFormChange}
                          rows="3"
                          disabled={submitLoading}
                          placeholder="Any recommendations for improvement..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                      disabled={submitLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={submitLoading || submitSuccess}
                    >
                      {submitLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Submitting...
                        </>
                      ) : submitSuccess ? (
                        <>
                          <CheckCircle size={16} className="me-2" />
                          Submitted!
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="me-2" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  )
}