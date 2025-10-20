// src/Pages/PL/PLCourses.jsx
import { useEffect, useState } from "react"
import api from "../../api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css"; 
import "../../CSS/PL.css";
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { BookPlus, Users, PlusCircle, CheckCircle2, Download, Search, Edit2, Trash2, X } from "lucide-react"

export default function PLCourses() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [message, setMessage] = useState("")
  const [editingCourse, setEditingCourse] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  
  const [newCourse, setNewCourse] = useState({
    course_code: "",
    course_name: "",
    faculty_name: "",
    stream_id: "",
    total_registered_students: 0,
    status: "active",
  })
  
  const [assigned, setAssigned] = useState({
    course_id: "",
    lecturer_id: "",
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
    try {
      const cRes = await api.get("/courses")
      const lRes = await api.get("/users")

      setCourses(cRes.data)
      setLecturers(lRes.data.filter((u) => u.role === "lecturer"))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddCourse(e) {
    e.preventDefault()
    try {
      await api.post("/courses", newCourse)
      setMessage("✅ Course added successfully!")
      setNewCourse({
        course_code: "",
        course_name: "",
        faculty_name: "",
        stream_id: "",
        total_registered_students: 0,
        status: "active",
      })
      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage("❌ Failed to add course.")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  async function handleUpdateCourse(e) {
    e.preventDefault()
    try {
      await api.put(`/courses/${editingCourse.id}`, editingCourse)
      setMessage("✅ Course updated successfully!")
      setEditingCourse(null)
      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage("❌ Failed to update course.")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  async function handleDeleteCourse() {
    try {
      await api.delete(`/courses/${courseToDelete.id}`)
      setMessage("✅ Course deleted successfully!")
      setShowDeleteModal(false)
      setCourseToDelete(null)
      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage("❌ Failed to delete course.")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  function startEdit(course) {
    setEditingCourse({ ...course })
  }

  function cancelEdit() {
    setEditingCourse(null)
  }

  function confirmDelete(course) {
    setCourseToDelete(course)
    setShowDeleteModal(true)
  }

  function cancelDelete() {
    setShowDeleteModal(false)
    setCourseToDelete(null)
  }

  async function handleAssignCourse(e) {
    e.preventDefault()
    try {
      await api.post("/assignments", {
        course_id: assigned.course_id,
        lecturer_id: assigned.lecturer_id,
        assigned_by: user.id,
      })
      setMessage("✅ Lecturer assigned successfully!")
      setAssigned({ course_id: "", lecturer_id: "" })
      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage("❌ Failed to assign lecturer.")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const exportCourses = () => {
    const data = courses.map(course => ({
      'Course Code': course.course_code,
      'Course Name': course.course_name,
      'Faculty': course.faculty_name,
      'Stream ID': course.stream_id,
      'Total Students': course.total_registered_students,
      'Status': course.status
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(dataBlob, `all_courses_${new Date().toISOString().split('T')[0]}.xlsx`)
    setMessage("✅ Courses exported successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  // Filter courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

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
                  <BookPlus size={48} />
                </div>
                <div>
                  <h1 className="pl-title mb-1">Course Management</h1>
                  <p className="pl-subtitle mb-0">Add courses, assign lecturers, and manage modules</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                onClick={exportCourses}
                className="btn btn-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export Courses
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - 3 cards in 1 row */}
        <div className="row g-4 mb-4">
          <div className="col-sm-6 col-md-4">
            <div className="pl-stat-card pl-stat-orange">
              <div className="stat-icon-bg">
                <BookPlus size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{filteredCourses.length}</div>
                <div className="stat-label">Total Courses</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="pl-stat-card pl-stat-green">
              <div className="stat-icon-bg">
                <CheckCircle2 size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{courses.filter(c => c.status === 'active').length}</div>
                <div className="stat-label">Active Courses</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="pl-stat-card pl-stat-blue">
              <div className="stat-icon-bg">
                <Users size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{lecturers.length}</div>
                <div className="stat-label">Available Lecturers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Edit Course Modal/Card */}
        {editingCourse && (
          <div className="mb-4">
            <div className="pl-card border-warning">
              <div className="pl-card-header bg-warning bg-opacity-10">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon header-icon-orange">
                      <Edit2 size={24} />
                    </div>
                    <div>
                      <h3 className="pl-card-title mb-0">Edit Course</h3>
                      <p className="pl-card-subtitle mb-0">Update course information</p>
                    </div>
                  </div>
                  <button onClick={cancelEdit} className="btn btn-sm btn-light">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="pl-label">Course Code *</label>
                    <input
                      type="text"
                      value={editingCourse.course_code}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, course_code: e.target.value })
                      }
                      className="pl-input"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="pl-label">Course Name *</label>
                    <input
                      type="text"
                      value={editingCourse.course_name}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, course_name: e.target.value })
                      }
                      className="pl-input"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="pl-label">Faculty Name *</label>
                    <input
                      type="text"
                      value={editingCourse.faculty_name}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, faculty_name: e.target.value })
                      }
                      className="pl-input"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="pl-label">Stream ID *</label>
                    <input
                      type="text"
                      value={editingCourse.stream_id}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, stream_id: e.target.value })
                      }
                      className="pl-input"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="pl-label">Total Students</label>
                    <input
                      type="number"
                      value={editingCourse.total_registered_students}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          total_registered_students: e.target.value,
                        })
                      }
                      className="pl-input"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="pl-label">Status</label>
                    <select
                      value={editingCourse.status}
                      onChange={(e) =>
                        setEditingCourse({ ...editingCourse, status: e.target.value })
                      }
                      className="pl-input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <div className="d-flex gap-2">
                      <button onClick={handleUpdateCourse} className="btn btn-warning btn-lg flex-fill">
                        <CheckCircle2 size={18} className="me-2" />
                        Save Changes
                      </button>
                      <button onClick={cancelEdit} className="btn btn-light btn-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body">
                  <div className="text-center py-3">
                    <Trash2 size={48} className="text-danger mb-3" />
                    <h5>Are you sure you want to delete this course?</h5>
                    <p className="text-muted mb-2">
                      <strong>{courseToDelete?.course_code}</strong> - {courseToDelete?.course_name}
                    </p>
                    <p className="text-muted small">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={cancelDelete}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteCourse}>
                    <Trash2 size={18} className="me-2" />
                    Delete Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Course Card - Full Width */}
        <div className="mb-4">
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-orange">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Add New Course</h3>
                  <p className="pl-card-subtitle mb-0">Create and configure new courses</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <label className="pl-label">Course Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., CS101"
                    value={newCourse.course_code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, course_code: e.target.value })
                    }
                    className="pl-input"
                  />
                </div>
                <div className="col-md-4">
                  <label className="pl-label">Course Name *</label>
                  <input
                    type="text"
                    placeholder="Introduction to Programming"
                    value={newCourse.course_name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, course_name: e.target.value })
                    }
                    className="pl-input"
                  />
                </div>
                <div className="col-md-4">
                  <label className="pl-label">Faculty Name *</label>
                  <input
                    type="text"
                    placeholder="Computer Science"
                    value={newCourse.faculty_name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, faculty_name: e.target.value })
                    }
                    className="pl-input"
                  />
                </div>
                <div className="col-md-4">
                  <label className="pl-label">Stream ID *</label>
                  <input
                    type="text"
                    placeholder="STR001"
                    value={newCourse.stream_id}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, stream_id: e.target.value })
                    }
                    className="pl-input"
                  />
                </div>
                <div className="col-md-4">
                  <label className="pl-label">Total Students</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={newCourse.total_registered_students}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        total_registered_students: e.target.value,
                      })
                    }
                    className="pl-input"
                  />
                </div>
                <div className="col-md-4">
                  <label className="pl-label">Status</label>
                  <select
                    value={newCourse.status}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, status: e.target.value })
                    }
                    className="pl-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-12">
                  <button onClick={handleAddCourse} className="btn btn-warning btn-lg w-100">
                    <PlusCircle size={18} className="me-2" />
                    Add Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Lecturer Card - Full Width */}
        <div className="mb-4">
          <div className="pl-card">
            <div className="pl-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="header-icon header-icon-blue">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="pl-card-title mb-0">Assign Lecturer</h3>
                  <p className="pl-card-subtitle mb-0">Match lecturers with courses</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-4 align-items-end">
                <div className="col-md-5">
                  <label className="pl-label">Select Course *</label>
                  <select
                    value={assigned.course_id}
                    onChange={(e) =>
                      setAssigned({ ...assigned, course_id: e.target.value })
                    }
                    className="pl-input"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="pl-label">Select Lecturer *</label>
                  <select
                    value={assigned.lecturer_id}
                    onChange={(e) =>
                      setAssigned({ ...assigned, lecturer_id: e.target.value })
                    }
                    className="pl-input"
                  >
                    <option value="">Choose a lecturer...</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} ({l.staff_student_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button onClick={handleAssignCourse} className="btn btn-primary btn-lg w-100">
                    <CheckCircle2 size={18} className="me-2" />
                    Assign
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="assignment-stats mt-4">
                <div className="stats-row">
                  <div className="stats-item">
                    <div className="stats-icon">📚</div>
                    <div>
                      <div className="stats-number">{courses.filter(c => c.status === 'active').length}</div>
                      <div className="stats-text">Active Courses</div>
                    </div>
                  </div>
                  <div className="stats-item">
                    <div className="stats-icon">👨‍🏫</div>
                    <div>
                      <div className="stats-number">{lecturers.length}</div>
                      <div className="stats-text">Available Lecturers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="pl-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search courses by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
                </div>
              </div>
              <div className="col-md-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-input"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="pl-card">
          <div className="pl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon header-icon-orange">
                <BookPlus size={24} />
              </div>
              <div>
                <h3 className="pl-card-title mb-0">All Courses</h3>
                <p className="pl-card-subtitle mb-0">Manage and view all courses</p>
              </div>
            </div>
            <span className="pl-badge pl-badge-orange">
              Showing {filteredCourses.length} of {courses.length}
            </span>
          </div>
          <div className="card-body p-0">
            {filteredCourses.length > 0 ? (
              <div className="table-responsive">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Faculty</th>
                      <th>Stream</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="report-id">{c.course_code}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{c.course_name}</td>
                        <td>{c.faculty_name}</td>
                        <td>
                          <span className="week-badge">{c.stream_id}</span>
                        </td>
                        <td>
                          <span className="students-count">{c.total_registered_students || 0}</span>
                        </td>
                        <td>
                          <span className={`badge ${c.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => startEdit(c)}
                              className="btn btn-sm btn-warning"
                              title="Edit course"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => confirmDelete(c)}
                              className="btn btn-sm btn-danger"
                              title="Delete course"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-table">
                <BookPlus size={64} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {searchTerm || filterStatus !== "all" 
                    ? "No courses match your filters" 
                    : "No courses available"}
                </h5>
                <p className="text-muted small">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Add your first course using the form above"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  )
}