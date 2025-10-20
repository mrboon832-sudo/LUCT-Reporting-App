import { useEffect, useState } from "react";
import api from '../../Api/api';
import Dashboard from '../../Components/Dashboard';
import '../../CSS/Dashboard.css'; 
import "../../CSS/PRL.css";
import { BookOpen, Users, Download, Building } from "lucide-react"

export default function CoursesPRL() {
  const [user, setUser] = useState(null)
  const [streamCourses, setStreamCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(false)

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

      const [coursesRes, lecturersRes] = await Promise.all([
        api.get("/courses"),
        api.get("/users")
      ])

      const filteredCourses = coursesRes.data.filter(
        (c) => c.stream_id === myStream.id
      )
      setStreamCourses(filteredCourses)
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
                  <BookOpen size={48} />
                </div>
                <div>
                  <h1 className="prl-title mb-1">Stream Courses</h1>
                  <p className="prl-subtitle mb-0">View all courses & lecturers under your stream</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button className="btn btn-light btn-lg shadow-sm">
                <Download size={20} className="me-2" />
                Export Courses
              </button>
            </div>
          </div>
        </div>

        <div className="prl-card">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-red">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">All Courses</h3>
                <p className="prl-card-subtitle mb-0">Courses under your supervision</p>
              </div>
            </div>
            <span className="prl-badge prl-badge-red">{streamCourses.length} courses</span>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : streamCourses.length > 0 ? (
              <div className="table-responsive">
                <table className="prl-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Faculty</th>
                      <th>Lecturer</th>
                      <th>Students</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streamCourses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <span className="course-code-prl">{course.course_code}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{course.course_name}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Building size={16} className="text-muted" />
                            {course.faculty_name}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Users size={16} className="text-muted" />
                            {getLecturerName(course.lecturer_id)}
                          </div>
                        </td>
                        <td>
                          <span className="students-count">{course.total_registered_students}</span>
                        </td>
                        <td>
                          <span className={`status-badge status-${course.status}`}>
                            {course.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-table">
                <BookOpen size={48} className="text-muted mb-2" />
                <p className="text-muted">No courses found for your stream</p>
              </div>
            )}
          </div>
        </div>

        <div className="prl-card mt-4">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-purple">
                <Users size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Lecturers Summary</h3>
                <p className="prl-card-subtitle mb-0">Faculty members in your stream</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {lecturers.map((lecturer) => {
                const lecturerCourses = streamCourses.filter(course => course.lecturer_id === lecturer.id)
                return (
                  <div key={lecturer.id} className="col-md-6 col-lg-4">
                    <div className="lecturer-card">
                      <div className="lecturer-header">
                        <div className="lecturer-avatar">
                          {lecturer.full_name?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <h6 className="mb-1">{lecturer.full_name}</h6>
                          <small className="text-muted">{lecturer.email}</small>
                        </div>
                      </div>
                      <div className="lecturer-stats">
                        <div className="stat">
                          <span>Courses:</span>
                          <strong>{lecturerCourses.length}</strong>
                        </div>
                        <div className="stat">
                          <span>Students:</span>
                          <strong>
                            {lecturerCourses.reduce((sum, course) => sum + (course.total_registered_students || 0), 0)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  )
}