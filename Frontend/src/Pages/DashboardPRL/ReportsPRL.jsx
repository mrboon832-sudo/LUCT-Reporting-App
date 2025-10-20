import { useEffect, useState } from "react";
import api from '../../Api/api';
import Dashboard from '../../Components/Dashboard';
import '../../CSS/Dashboard.css'; 
import "../../CSS/PRL.css";
import { FileText, Download, MessageSquare, Filter, Calendar, Eye, User, Clock, MapPin, Users, BookOpen } from "lucide-react"

export default function ReportsPRL() {
  const [user, setUser] = useState(null)
  const [reports, setReports] = useState([])
  const [courses, setCourses] = useState([])
  const [feedbackText, setFeedbackText] = useState("")
  const [selectedReport, setSelectedReport] = useState(null)
  const [viewingFeedback, setViewingFeedback] = useState(null)
  const [viewingReport, setViewingReport] = useState(null)
  const [feedbackList, setFeedbackList] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    course: "all",
    status: "all"
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      fetchData()
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [reportsRes, coursesRes, feedbackRes] = await Promise.all([
        api.get("/reports"),
        api.get("/courses"),
        api.get("/feedback")
      ])
      setReports(reportsRes.data)
      setCourses(coursesRes.data)
      setFeedbackList(feedbackRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/feedback", {
        report_id: selectedReport.id,
        prl_id: user.id,
        feedback_text: feedbackText,
      })
      setFeedbackText("")
      setSelectedReport(null)
      fetchData()
    } catch (err) {
      console.error("Failed to submit feedback:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleViewFeedback(report) {
    const reportFeedback = feedbackList.filter(fb => fb.report_id === report.id)
    setViewingFeedback({
      report,
      feedback: reportFeedback
    })
  }

  function handleViewReport(report) {
    setViewingReport(report)
  }

  const filteredReports = reports.filter(report => {
    const matchesCourse = filters.course === "all" || report.course_id === filters.course
    return matchesCourse
  })

  const getFeedbackCount = (reportId) => {
    return feedbackList.filter(fb => fb.report_id === reportId).length
  }

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
                  <FileText size={48} />
                </div>
                <div>
                  <h1 className="prl-title mb-1">Lecture Reports</h1>
                  <p className="prl-subtitle mb-0">Review lecture reports and provide feedback to lecturers</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button className="btn btn-light btn-lg shadow-sm">
                <Download size={20} className="me-2" />
                Export Reports
              </button>
            </div>
          </div>
        </div>

        <div className="prl-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="prl-label">Filter by Course</label>
                <select
                  value={filters.course}
                  onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                  className="prl-input"
                >
                  <option value="all">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="prl-label">Date Range</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="prl-input"
                >
                  <option value="all">All Reports</option>
                  <option value="recent">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="prl-card">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-orange">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">All Reports</h3>
                <p className="prl-card-subtitle mb-0">Review and provide feedback on lecture reports</p>
              </div>
            </div>
            <span className="prl-badge prl-badge-orange">
              {filteredReports.length} reports
            </span>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredReports.length > 0 ? (
              <div className="table-responsive">
                <table className="prl-table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Lecturer</th>
                      <th>Course</th>
                      <th>Week</th>
                      <th>Students</th>
                      <th>Topic</th>
                      <th>Date</th>
                      <th>Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const course = courses.find(c => c.id === report.course_id)
                      const feedbackCount = getFeedbackCount(report.id)
                      return (
                        <tr key={report.id}>
                          <td>#{report.id}</td>
                          <td>Lecturer {report.lecturer_id}</td>
                          <td>
                            <div>
                              <div className="fw-semibold">{course?.course_code || 'N/A'}</div>
                              <div className="text-muted small">{course?.course_name || 'Course not found'}</div>
                            </div>
                          </td>
                          <td>
                            <span className="week-badge">Week {report.week_of_reporting}</span>
                          </td>
                          <td>
                            <span className="students-count">{report.actual_students_present}</span>
                          </td>
                          <td>
                            <span className="text-truncate" style={{maxWidth: '200px'}} title={report.topic_taught}>
                              {report.topic_taught}
                            </span>
                          </td>
                          <td>
                            {new Date(report.date_of_lecture).toLocaleDateString()}
                          </td>
                          <td>
                            {feedbackCount > 0 ? (
                              <span className="feedback-badge">
                                {feedbackCount} feedback{feedbackCount !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-muted">No feedback</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                onClick={() => handleViewReport(report)}
                                className="btn btn-sm btn-info"
                                title="View Report Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => setSelectedReport(report)}
                                className="btn btn-sm btn-danger"
                                title="Add Feedback"
                              >
                                <MessageSquare size={14} />
                              </button>
                              {feedbackCount > 0 && (
                                <button
                                  onClick={() => handleViewFeedback(report)}
                                  className="btn btn-sm btn-primary"
                                  title="View Feedback"
                                >
                                  <User size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-table">
                <FileText size={48} className="text-muted mb-2" />
                <p className="text-muted">No reports found</p>
              </div>
            )}
          </div>
        </div>

        {viewingReport && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content prl-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FileText size={20} className="me-2" />
                    Report Details #{viewingReport.id}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setViewingReport(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="report-detail-item">
                        <div className="detail-icon">
                          <User size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Lecturer ID</div>
                          <div className="detail-value">Lecturer {viewingReport.lecturer_id}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="report-detail-item">
                        <div className="detail-icon">
                          <Calendar size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Week</div>
                          <div className="detail-value">Week {viewingReport.week_of_reporting}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="report-detail-item">
                        <div className="detail-icon">
                          <Clock size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Lecture Date</div>
                          <div className="detail-value">{new Date(viewingReport.date_of_lecture).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="report-detail-item">
                        <div className="detail-icon">
                          <MapPin size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Venue</div>
                          <div className="detail-value">{viewingReport.venue}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="report-detail-item">
                        <div className="detail-icon">
                          <Users size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Students Present</div>
                          <div className="detail-value">{viewingReport.actual_students_present}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="report-detail-item">
                        <div className="detail-icon">
                          <BookOpen size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Course</div>
                          <div className="detail-value">
                            {courses.find(c => c.id === viewingReport.course_id)?.course_code || 'N/A'} - 
                            {courses.find(c => c.id === viewingReport.course_id)?.course_name || 'Course not found'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="report-section mb-4">
                    <h6 className="section-title">
                      <BookOpen size={16} className="me-2" />
                      Topic Taught
                    </h6>
                    <div className="section-content">
                      {viewingReport.topic_taught}
                    </div>
                  </div>
                
                  {viewingReport.challenges_faced && (
                    <div className="report-section mb-4">
                      <h6 className="section-title text-warning">
                        <FileText size={16} className="me-2" />
                        Challenges Faced
                      </h6>
                      <div className="section-content">
                        {viewingReport.challenges_faced}
                      </div>
                    </div>
                  )}

                  {viewingReport.recommendations && (
                    <div className="report-section">
                      <h6 className="section-title text-info">
                        <FileText size={16} className="me-2" />
                        Recommendations
                      </h6>
                      <div className="section-content">
                        {viewingReport.recommendations}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setViewingReport(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingReport(null)
                      setSelectedReport(viewingReport)
                    }}
                    className="btn btn-danger"
                  >
                    <MessageSquare size={16} className="me-2" />
                    Add Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content prl-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <MessageSquare size={20} className="me-2" />
                    Add Feedback for Report #{selectedReport.id}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setSelectedReport(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="report-summary-prl mb-3">
                    <div className="summary-item">
                      <strong>Week:</strong> {selectedReport.week_of_reporting}
                    </div>
                    <div className="summary-item">
                      <strong>Topic:</strong> {selectedReport.topic_taught}
                    </div>
                    <div className="summary-item">
                      <strong>Students Present:</strong> {selectedReport.actual_students_present}
                    </div>
                    <div className="summary-item">
                      <strong>Venue:</strong> {selectedReport.venue}
                    </div>
                  </div>
                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="mb-3">
                      <label className="prl-label">Your Feedback</label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Provide constructive feedback on this lecture report..."
                        className="prl-input"
                        rows="5"
                        required
                      ></textarea>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReport(null)}
                        className="btn btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-danger"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <MessageSquare size={16} className="me-2" />
                            Submit Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingFeedback && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content prl-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <User size={20} className="me-2" />
                    Feedback for Report #{viewingFeedback.report.id}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setViewingFeedback(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="report-summary-prl mb-4">
                    <div className="summary-item">
                      <strong>Week:</strong> {viewingFeedback.report.week_of_reporting}
                    </div>
                    <div className="summary-item">
                      <strong>Topic:</strong> {viewingFeedback.report.topic_taught}
                    </div>
                    <div className="summary-item">
                      <strong>Students Present:</strong> {viewingFeedback.report.actual_students_present}
                    </div>
                    <div className="summary-item">
                      <strong>Venue:</strong> {viewingFeedback.report.venue}
                    </div>
                  </div>

                  {viewingFeedback.feedback.length > 0 ? (
                    <div className="feedback-list">
                      <h6 className="mb-3">All Feedback ({viewingFeedback.feedback.length})</h6>
                      {viewingFeedback.feedback.map((feedback) => (
                        <div key={feedback.id} className="feedback-item card mb-3">
                          <div className="card-body">
                            <div className="mb-2">
                              <strong className="text-primary">PRL Feedback</strong>
                              <small className="text-muted ms-2">
                                {new Date(feedback.created_at).toLocaleDateString()} at{' '}
                                {new Date(feedback.created_at).toLocaleTimeString()}
                              </small>
                            </div>
                            <p className="mb-0 feedback-text">{feedback.feedback_text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MessageSquare size={48} className="text-muted mb-3" />
                      <p className="text-muted">No feedback has been provided for this report yet.</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setViewingFeedback(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingFeedback(null)
                      setSelectedReport(viewingFeedback.report)
                    }}
                    className="btn btn-danger"
                  >
                    <MessageSquare size={16} className="me-2" />
                    Add New Feedback
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