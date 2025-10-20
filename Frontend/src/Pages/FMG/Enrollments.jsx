// src/Pages/FMG/Enrollments.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/FMG.css";
import { 
  UserPlus, PlusCircle, ArrowLeft, Edit2, Trash2, X, Search
} from "lucide-react";

export default function EnrollmentsManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);

  const [enrollData, setEnrollData] = useState({
    student_id: "",
    course_id: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchData();
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [usersRes, coursesRes, enrollmentsRes] = await Promise.all([
        api.get("/users"),
        api.get("/courses"),
        api.get("/enrollments")
      ]);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setMessage("❌ Error loading data");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnrollStudent(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/enrollments", enrollData);
      setMessage("✅ Student enrolled successfully!");
      setEnrollData({ student_id: "", course_id: "" });
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to enroll student: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEnrollment(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/enrollments/${editingEnrollment.id}`, {
        student_id: enrollData.student_id,
        course_id: enrollData.course_id
      });
      setMessage("✅ Enrollment updated successfully!");
      setEnrollData({ student_id: "", course_id: "" });
      setEditingEnrollment(null);
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update enrollment: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEnrollment(enrollmentId) {
    if (!window.confirm("Are you sure you want to delete this enrollment? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/enrollments/${enrollmentId}`);
      setMessage("✅ Enrollment deleted successfully!");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete enrollment: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  function handleEditEnrollment(enrollment) {
    setEditingEnrollment(enrollment);
    setEnrollData({
      student_id: enrollment.student_id,
      course_id: enrollment.course_id
    });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingEnrollment(null);
    setEnrollData({ student_id: "", course_id: "" });
    setShowForm(false);
  }

  const students = users.filter(u => u.role === "student");
  const filteredEnrollments = enrollments.filter(enrollment => {
    const student = users.find(u => u.id === enrollment.student_id);
    const course = courses.find(c => c.id === enrollment.course_id);
    
    const studentName = student?.full_name?.toLowerCase() || '';
    const courseName = course?.course_name?.toLowerCase() || '';
    const courseCode = course?.course_code?.toLowerCase() || '';
    
    return (
      studentName.includes(searchTerm.toLowerCase()) ||
      courseName.includes(searchTerm.toLowerCase()) ||
      courseCode.includes(searchTerm.toLowerCase())
    );
  });

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Dashboard user={user}>
      <div className="fmg-dashboard">
        {/* Header */}
        <div className="fmg-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <Link to="/fmg" className="btn btn-fmg-outline btn-sm">
                  <ArrowLeft size={20} />
                </Link>
                <div className="fmg-icon">
                  <UserPlus size={48} />
                </div>
                <div>
                  <h1 className="fmg-title mb-1">Enrollments Management</h1>
                  <p className="fmg-subtitle mb-0">Manage student course enrollments</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingEnrollment(null);
                  setEnrollData({ student_id: "", course_id: "" });
                }}
                className="btn btn-fmg-primary btn-lg"
                disabled={loading}
              >
                <PlusCircle size={20} className="me-2" />
                New Enrollment
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('✅') ? 'fmg-alert-success' : 'fmg-alert-danger'} alert-dismissible fade show fmg-alert mb-4`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Enrollment Form - Full Width */}
        {showForm && (
          <div className="fmg-card mb-4">
            <div className="fmg-card-header">
              <div className="d-flex align-items-center justify-content-between">
                <h3 className="fmg-card-title mb-0">
                  {editingEnrollment ? 'Edit Enrollment' : 'Create New Enrollment'}
                </h3>
                <button onClick={handleCancelEdit} className="btn btn-sm btn-light">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={editingEnrollment ? handleUpdateEnrollment : handleEnrollStudent}>
                <div className="row g-4">
                  <div className="col-md-5">
                    <label className="fmg-label">Select Student *</label>
                    <select
                      className="fmg-input"
                      value={enrollData.student_id}
                      onChange={(e) => setEnrollData({ ...enrollData, student_id: e.target.value })}
                      required
                      disabled={loading}
                    >
                      <option value="">Choose a student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.staff_student_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-5">
                    <label className="fmg-label">Select Course *</label>
                    <select
                      className="fmg-input"
                      value={enrollData.course_id}
                      onChange={(e) => setEnrollData({ ...enrollData, course_id: e.target.value })}
                      required
                      disabled={loading}
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.course_code} - {c.course_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button 
                      type="submit" 
                      className="btn btn-fmg-primary btn-lg w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : editingEnrollment ? (
                        <Edit2 size={18} className="me-2" />
                      ) : (
                        <PlusCircle size={18} className="me-2" />
                      )}
                      {editingEnrollment ? 'Update' : 'Enroll'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="fmg-card mb-4">
          <div className="card-body">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by student name, course name, or course code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="fmg-input"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#adb5bd' 
              }} />
            </div>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="fmg-card">
          <div className="fmg-card-header">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h3 className="fmg-card-title mb-0">All Enrollments</h3>
                <p className="fmg-card-subtitle mb-0">View and manage student enrollments</p>
              </div>
              <span className="fmg-badge">
                Showing {filteredEnrollments.length} of {enrollments.length}
              </span>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredEnrollments.length > 0 ? (
              <div className="table-responsive">
                <table className="fmg-table">
                  <thead>
                    <tr>
                      <th>Enrollment ID</th>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Faculty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((enrollment) => {
                      const student = users.find(u => u.id === enrollment.student_id);
                      const course = courses.find(c => c.id === enrollment.course_id);
                      
                      return (
                        <tr key={enrollment.id}>
                          <td>
                            <span className="fmg-badge-light">#{enrollment.id}</span>
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {student?.full_name || 'Unknown Student'}
                          </td>
                          <td>{student?.staff_student_id || 'N/A'}</td>
                          <td>
                            <span className="fmg-course-code">
                              {course?.course_code || 'N/A'}
                            </span>
                          </td>
                          <td>{course?.course_name || 'Unknown Course'}</td>
                          <td>{course?.faculty_name || 'N/A'}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleEditEnrollment(enrollment)}
                                className="btn btn-sm btn-warning"
                                title="Edit enrollment"
                                disabled={loading}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteEnrollment(enrollment.id)}
                                className="btn btn-sm btn-danger"
                                title="Delete enrollment"
                                disabled={loading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-table">
                <UserPlus size={64} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {searchTerm 
                    ? "No enrollments match your search" 
                    : "No enrollments yet"}
                </h5>
                <p className="text-muted small">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Click 'New Enrollment' to add your first student enrollment"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}