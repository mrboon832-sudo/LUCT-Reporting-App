// src/Pages/Lecturer/LecturerRatings.jsx
import { useEffect, useState } from "react"
import api from '../../Api/api';
import Dashboard from '../../Components/Dashboard'; 
import '../../CSS/Dashboard.css'; 
import "../../CSS/Lecturer.css";
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { Star, Award, Download, TrendingUp, BarChart3, MessageSquare } from "lucide-react"

export default function LecturerRatings() {
  const [user, setUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [courses, setCourses] = useState([])
  const [filterCourse, setFilterCourse] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const [message, setMessage] = useState("")

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
      const ratingRes = await api.get("/ratings")
      const lecturerRatings = ratingRes.data.filter(
        (r) => r.lecturer_id === lecturerId
      )
      setRatings(lecturerRatings)

      const coursesRes = await api.get("/courses")
      setCourses(coursesRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const exportRatings = () => {
    const data = ratings.map(rating => {
      const course = courses.find((c) => c.id === rating.course_id)
      return {
        'Rating ID': rating.id,
        'Course Code': course?.course_code,
        'Course Name': course?.course_name,
        'Rating': rating.rating,
        'Comment': rating.comment,
        'Student ID': rating.student_id,
        'Date': new Date(rating.created_at || Date.now()).toLocaleDateString()
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Ratings')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `my_ratings_${user?.staff_student_id}_${new Date().toISOString().split('T')[0]}.xlsx`)
    setMessage("✅ Ratings exported successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  // Get unique courses from ratings
  const ratedCourses = ["all", ...new Set(
    ratings.map(r => {
      const course = courses.find(c => c.id === r.course_id)
      return course?.course_name
    }).filter(Boolean)
  )]

  // Filter ratings
  const filteredRatings = ratings.filter(r => {
    const course = courses.find(c => c.id === r.course_id)
    const matchesCourse = filterCourse === "all" || course?.course_name === filterCourse
    const matchesRating = filterRating === "all" || r.rating.toString() === filterRating
    return matchesCourse && matchesRating
  })

  // Calculate stats
  const avgRating = filteredRatings.length > 0 
    ? (filteredRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / filteredRatings.length).toFixed(1)
    : "N/A"

  const ratingDistribution = {
    5: filteredRatings.filter(r => r.rating === 5).length,
    4: filteredRatings.filter(r => r.rating === 4).length,
    3: filteredRatings.filter(r => r.rating === 3).length,
    2: filteredRatings.filter(r => r.rating === 2).length,
    1: filteredRatings.filter(r => r.rating === 1).length,
  }

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
        {/* Page Header */}
        <div className="dashboard-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="hero-icon">
                  <Star size={48} />
                </div>
                <div>
                  <h1 className="hero-title mb-1">My Ratings</h1>
                  <p className="hero-subtitle mb-0">
                    View student feedback and ratings
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportRatings}
                className="btn btn-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export Ratings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="stat-card stat-card-yellow">
              <div className="stat-icon">
                <Star size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{avgRating}</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <MessageSquare size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{filteredRatings.length}</div>
                <div className="stat-label">Total Ratings</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-green">
              <div className="stat-icon">
                <Award size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{ratingDistribution[5]}</div>
                <div className="stat-label">5-Star Ratings</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {filteredRatings.length > 0 ? ((ratingDistribution[5] + ratingDistribution[4]) / filteredRatings.length * 100).toFixed(0) : 0}%
                </div>
                <div className="stat-label">Positive Ratings</div>
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

        <div className="row g-4 mb-4">
          {/* Rating Distribution Chart */}
          <div className="col-lg-5">
            <div className="modern-card">
              <div className="card-header-modern">
                <div className="d-flex align-items-center gap-2">
                  <BarChart3 size={24} className="text-warning" />
                  <h3 className="card-title-modern mb-0">Rating Distribution</h3>
                </div>
              </div>
              <div className="card-body">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingDistribution[star]
                  const percentage = filteredRatings.length > 0 ? (count / filteredRatings.length * 100).toFixed(0) : 0
                  return (
                    <div key={star} className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', width: '60px' }}>{star} Star</span>
                          <div className="d-flex">
                            {[...Array(star)].map((_, i) => (
                              <Star key={i} size={14} fill="#ffc107" color="#ffc107" />
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>{count}</span>
                      </div>
                      <div style={{ background: '#e9ecef', borderRadius: '1rem', height: '8px', overflow: 'hidden' }}>
                        <div style={{ 
                          background: star >= 4 ? '#28a745' : star === 3 ? '#ffc107' : '#dc3545',
                          width: `${percentage}%`, 
                          height: '100%', 
                          borderRadius: '1rem',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="col-lg-7">
            <div className="modern-card">
              <div className="card-header-modern">
                <div className="d-flex align-items-center gap-2">
                  <Award size={24} className="text-success" />
                  <h3 className="card-title-modern mb-0">Filter Ratings</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="modern-label">Filter by Course</label>
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="modern-input"
                    >
                      <option value="all">All Courses</option>
                      {ratedCourses.slice(1).map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="modern-label">Filter by Rating</label>
                    <select
                      value={filterRating}
                      onChange={(e) => setFilterRating(e.target.value)}
                      className="modern-input"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-3" style={{ background: '#f8f9fa', borderRadius: '0.75rem', borderLeft: '4px solid #ffc107' }}>
                  <h6 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    💡 Using Feedback Effectively
                  </h6>
                  <ul style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: 0, paddingLeft: '1.25rem' }}>
                    <li>Identify common themes in student comments</li>
                    <li>Focus on constructive criticism for improvement</li>
                    <li>Celebrate positive feedback and maintain strengths</li>
                    <li>Address concerns raised in lower ratings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings List */}
        <div className="modern-card">
          <div className="card-header-modern">
            <div className="d-flex align-items-center gap-2">
              <Star size={24} className="text-warning" />
              <h3 className="card-title-modern mb-0">All Ratings</h3>
            </div>
            <span className="badge bg-warning-subtle text-warning">
              Showing {filteredRatings.length} of {ratings.length}
            </span>
          </div>
          <div className="card-body">
            {filteredRatings.length > 0 ? (
              <div className="row g-3">
                {filteredRatings.map((r) => {
                  const course = courses.find(c => c.id === r.course_id)
                  return (
                    <div key={r.id} className="col-md-6 col-lg-4">
                      <div className="rating-card">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#28a745' }}>
                            {course?.course_code}
                          </span>
                          <div className="rating-header">
                            <div className="rating-stars">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < r.rating ? "star-filled" : "star-empty"}
                                  fill={i < r.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                            <span className="rating-value">{r.rating}/5</span>
                          </div>
                        </div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          {course?.course_name}
                        </h6>
                        <p className="rating-comment">"{r.comment || 'No comment provided'}"</p>
                        <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.5rem' }}>
                          Student ID: {r.student_id}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Star size={64} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {filterCourse !== "all" || filterRating !== "all"
                    ? "No ratings match your filters"
                    : "No ratings yet"}
                </h5>
                <p className="text-muted small">
                  {filterCourse !== "all" || filterRating !== "all"
                    ? "Try adjusting your filter criteria"
                    : "Students haven't submitted any ratings yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  )
}