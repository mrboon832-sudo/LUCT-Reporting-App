import { useEffect, useState } from "react";
import api from '../../Api/api';
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import Dashboard from '../../Components/Dashboard';
import '../../CSS/Dashboard.css'; 
import "../../CSS/PRL.css";
import { 
  Star, 
  Download, 
  TrendingUp,
  Users,
  Award,
  BarChart3,
  MessageSquare
} from "lucide-react"

export default function PRLRatings() {
  const [user, setUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [filters, setFilters] = useState({
    course: "all",
    lecturer: "all",
    rating: "all"
  })

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
        setMessage("⚠️ No stream assigned to your account")
        setLoading(false)
        return
      }

      const [ratingsRes, coursesRes, lecturersRes] = await Promise.all([
        api.get("/ratings"),
        api.get("/courses"),
        api.get("/users")
      ])


      const streamCourses = coursesRes.data.filter(c => c.stream_id === myStream.id)
      const streamCourseIds = streamCourses.map(c => c.id)
      

      const streamRatings = ratingsRes.data.filter(r => streamCourseIds.includes(r.course_id))

      setRatings(streamRatings)
      setCourses(streamCourses)
      setLecturers(lecturersRes.data.filter(u => u.role === "lecturer"))
    } catch (err) {
      console.error(err)
      setMessage("❌ Error loading ratings data")
    } finally {
      setLoading(false)
    }
  }

  const filteredRatings = ratings.filter(rating => {
    const matchesCourse = filters.course === "all" || rating.course_id.toString() === filters.course
    const matchesLecturer = filters.lecturer === "all" || rating.lecturer_id.toString() === filters.lecturer
    const matchesRating = filters.rating === "all" || rating.rating.toString() === filters.rating
    
    return matchesCourse && matchesLecturer && matchesRating
  })


  const stats = {
    totalRatings: ratings.length,
    averageRating: ratings.length > 0 
      ? (ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratings.length).toFixed(1)
      : "0.0",
    fiveStarRatings: ratings.filter(r => r.rating === 5).length,
    positiveRatings: ratings.filter(r => r.rating >= 4).length,
  }

  const ratingDistribution = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  }

  const getLecturerName = (lecturerId) => {
    const lecturer = lecturers.find(l => l.id === lecturerId)
    return lecturer ? lecturer.full_name : `Lecturer ${lecturerId}`
  }

  const exportRatings = () => {
    const data = filteredRatings.map(rating => {
      const course = courses.find(c => c.id === rating.course_id)
      const lecturer = lecturers.find(l => l.id === rating.lecturer_id)
      
      return {
        'Rating ID': rating.id,
        'Course Code': course?.course_code || 'N/A',
        'Course Name': course?.course_name || 'N/A',
        'Lecturer': lecturer?.full_name || `Lecturer ${rating.lecturer_id}`,
        'Rating': rating.rating,
        'Comment': rating.comment || 'No comment',
        'Student ID': rating.student_id
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ratings')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `prl_ratings_${new Date().toISOString().split('T')[0]}.xlsx`)
    setMessage("✅ Ratings exported successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const topLecturers = lecturers
    .map(lecturer => {
      const lecturerRatings = ratings.filter(r => r.lecturer_id === lecturer.id)
      const avgRating = lecturerRatings.length > 0 
        ? (lecturerRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / lecturerRatings.length)
        : 0
      
      return {
        ...lecturer,
        ratingsCount: lecturerRatings.length,
        avgRating: avgRating.toFixed(1)
      }
    })
    .filter(l => l.ratingsCount > 0)
    .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating))
    .slice(0, 5)

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
                  <Star size={48} />
                </div>
                <div>
                  <h1 className="prl-title mb-1">Student Ratings</h1>
                  <p className="prl-subtitle mb-0">View and analyze student feedback for your stream</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button 
                onClick={exportRatings}
                className="btn btn-light btn-lg shadow-sm"
                disabled={filteredRatings.length === 0}
              >
                <Download size={20} className="me-2" />
                Export Ratings
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('⚠️') ? 'alert-warning' : 'alert-danger'} alert-dismissible fade show mb-4`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        <div className="row g-4 mb-4">
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-yellow">
              <div className="stat-icon-prl">
                <Star size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats.totalRatings}</div>
                <div className="stat-label">Total Ratings</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>Student Feedback</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-orange">
              <div className="stat-icon-prl">
                <Award size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats.averageRating}</div>
                <div className="stat-label">Average Rating</div>
                <div className="stat-trend">
                  <BarChart3 size={16} />
                  <span>Overall Performance</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="prl-stat-card prl-stat-green">
              <div className="stat-icon-prl">
                <TrendingUp size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats.fiveStarRatings}</div>
                <div className="stat-label">5-Star Ratings</div>
                <div className="stat-trend">
                  <Star size={16} />
                  <span>Excellent Feedback</span>
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
                <div className="stat-value">
                  {stats.totalRatings > 0 ? Math.round((stats.positiveRatings / stats.totalRatings) * 100) : 0}%
                </div>
                <div className="stat-label">Positive Ratings</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>4+ Stars</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="prl-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
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
              <div className="col-md-4">
                <label className="prl-label">Filter by Lecturer</label>
                <select
                  value={filters.lecturer}
                  onChange={(e) => setFilters(prev => ({ ...prev, lecturer: e.target.value }))}
                  className="prl-input"
                >
                  <option value="all">All Lecturers</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="prl-label">Filter by Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                  className="prl-input"
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
          </div>
        </div>


        <div className="prl-card mb-4">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-purple">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Rating Distribution</h3>
                <p className="prl-card-subtitle mb-0">Breakdown of all ratings across your stream</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-lg-8">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingDistribution[star]
                  const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings * 100).toFixed(0) : 0
                  
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
                        <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>{count} ratings ({percentage}%)</span>
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
              <div className="col-lg-4 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <div className="display-4 fw-bold text-primary">{stats.averageRating}</div>
                  <div className="text-muted">Average Rating</div>
                  <div className="d-flex justify-content-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.floor(stats.averageRating) ? "text-warning" : "text-muted"}
                        fill={i < Math.floor(stats.averageRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="prl-card mb-4">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-yellow">
                <Award size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Top Lecturers</h3>
                <p className="prl-card-subtitle mb-0">Highest rated faculty in your stream</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {topLecturers.length > 0 ? (
              <div className="row g-4">
                {topLecturers.map((lecturer, index) => (
                  <div key={lecturer.id} className="col-md-6 col-lg-4">
                    <div style={{ 
                      padding: '1.25rem', 
                      background: '#f8f9fa', 
                      borderRadius: '0.75rem', 
                      borderLeft: `4px solid ${index === 0 ? '#ffc107' : index === 1 ? '#6c757d' : index === 2 ? '#cd7f32' : '#007bff'}`,
                      height: '100%'
                    }}>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: index === 0 ? '#ffc107' : index === 1 ? '#6c757d' : index === 2 ? '#cd7f32' : '#007bff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.125rem'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{lecturer.full_name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>{lecturer.ratingsCount} ratings</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-1">
                          <Star size={18} fill="#ffc107" color="#ffc107" />
                          <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>{lecturer.avgRating}</span>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: parseFloat(lecturer.avgRating) >= 4.5 ? '#28a745' : 
                                     parseFloat(lecturer.avgRating) >= 4.0 ? '#17a2b8' : 
                                     parseFloat(lecturer.avgRating) >= 3.5 ? '#ffc107' : '#dc3545',
                          color: 'white',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {parseFloat(lecturer.avgRating) >= 4.5 ? 'Excellent' : 
                           parseFloat(lecturer.avgRating) >= 4.0 ? 'Very Good' : 
                           parseFloat(lecturer.avgRating) >= 3.5 ? 'Good' : 'Needs Improvement'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <Award size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No ratings yet</h5>
                <p className="text-muted">Ratings will appear here once students submit feedback</p>
              </div>
            )}
          </div>
        </div>

        <div className="prl-card">
          <div className="prl-card-header">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon-prl header-icon-orange">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="prl-card-title mb-0">All Ratings</h3>
                  <p className="prl-card-subtitle mb-0">Detailed student feedback for your stream</p>
                </div>
              </div>
              <span className="prl-badge prl-badge-orange">
                {filteredRatings.length} of {ratings.length} ratings
              </span>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredRatings.length > 0 ? (
              <div className="ratings-grid-prl">
                {filteredRatings.map((rating) => {
                  const course = courses.find(c => c.id === rating.course_id)
                  return (
                    <div key={rating.id} className="rating-card-prl">
                      <div className="rating-header-prl">
                        <span className="lecturer-id-prl">{getLecturerName(rating.lecturer_id)}</span>
                        <div className="rating-stars-prl">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < rating.rating ? "star-filled-prl" : "star-empty-prl"}
                              fill={i < rating.rating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rating-score-prl">{rating.rating}/5</div>
                      <p className="rating-comment-prl">"{rating.comment || 'No comment provided'}"</p>
                      <div className="rating-footer-prl">
                        <div>Course: {course?.course_code}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Student: {rating.student_id}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state-prl text-center py-5">
                <Star size={64} className="text-muted mb-3" />
                <h5 className="text-muted">No ratings found</h5>
                <p className="text-muted">
                  {filters.course !== "all" || filters.lecturer !== "all" || filters.rating !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "Ratings will appear here once students submit feedback for courses in your stream"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  )
}