// src/Pages/FMG/Courses.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/fmg.css";
import { 
  BookOpen, PlusCircle, Edit3, Trash2, ArrowLeft,
  Search, Filter, Layers, Users, Calendar
} from "lucide-react";

export default function FMGCoursesManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [filterStream, setFilterStream] = useState("");

  const [courseData, setCourseData] = useState({
    course_code: "",
    course_name: "",
    faculty_name: "",
    stream_id: ""
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
      const [usersRes, coursesRes, streamsRes] = await Promise.all([
        api.get("/users"),
        api.get("/courses"),
        api.get("/streams")
      ]);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setStreams(streamsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setMessage("❌ Error loading data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/courses", {
        course_code: courseData.course_code,
        course_name: courseData.course_name,
        faculty_name: courseData.faculty_name,
        stream_id: courseData.stream_id || null
      });
      setMessage("✅ Course created successfully!");
      setCourseData({ course_code: "", course_name: "", faculty_name: "", stream_id: "" });
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to create course: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCourse(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/courses/${editingCourse.id}`, {
        course_code: courseData.course_code,
        course_name: courseData.course_name,
        faculty_name: courseData.faculty_name,
        stream_id: courseData.stream_id || null
      });
      setMessage("✅ Course updated successfully!");
      setCourseData({ course_code: "", course_name: "", faculty_name: "", stream_id: "" });
      setEditingCourse(null);
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update course: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCourse(courseId) {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/courses/${courseId}`);
      setMessage("✅ Course deleted successfully!");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete course: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  function handleEditCourse(course) {
    setEditingCourse(course);
    setCourseData({
      course_code: course.course_code,
      course_name: course.course_name,
      faculty_name: course.faculty_name,
      stream_id: course.stream_id || ""
    });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingCourse(null);
    setCourseData({ course_code: "", course_name: "", faculty_name: "", stream_id: "" });
    setShowForm(false);
  }

  // Filter courses based on search term and stream filter
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.faculty_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStream = filterStream ? course.stream_id === filterStream : true;
    
    return matchesSearch && matchesStream;
  });

  // Get course statistics
  const coursesWithStream = courses.filter(c => c.stream_id).length;
  const coursesWithoutStream = courses.filter(c => !c.stream_id).length;

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
                  <BookOpen size={48} />
                </div>
                <div>
                  <h1 className="fmg-title mb-1">Courses Management</h1>
                  <p className="fmg-subtitle mb-0">Create, edit, and manage academic courses</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-fmg-primary btn-lg"
                disabled={loading}
              >
                <PlusCircle size={20} className="me-2" />
                Create Course
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

        {/* Course Statistics */}
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-purple">
              <div className="fmg-stat-icon">
                <BookOpen size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{courses.length}</div>
                <div className="fmg-stat-label">Total Courses</div>
                <div className="fmg-stat-trend">
                  <span>All Programs</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-teal">
              <div className="fmg-stat-icon">
                <Layers size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{coursesWithStream}</div>
                <div className="fmg-stat-label">With Stream</div>
                <div className="fmg-stat-trend">
                  <span>Assigned</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-indigo">
              <div className="fmg-stat-icon">
                <BookOpen size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{coursesWithoutStream}</div>
                <div className="fmg-stat-label">Without Stream</div>
                <div className="fmg-stat-trend">
                  <span>Unassigned</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-pink">
              <div className="fmg-stat-icon">
                <Users size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{streams.length}</div>
                <div className="fmg-stat-label">Available Streams</div>
                <div className="fmg-stat-trend">
                  <span>For Assignment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Form */}
        {showForm && (
          <div className="fmg-card mb-4">
            <div className="fmg-card-header">
              <h3 className="fmg-card-title mb-0">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="fmg-label">Course Code *</label>
                    <input
                      type="text"
                      className="fmg-input"
                      placeholder="e.g., CS101"
                      value={courseData.course_code}
                      onChange={(e) => setCourseData({ ...courseData, course_code: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fmg-label">Course Name *</label>
                    <input
                      type="text"
                      className="fmg-input"
                      placeholder="e.g., Introduction to Computer Science"
                      value={courseData.course_name}
                      onChange={(e) => setCourseData({ ...courseData, course_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fmg-label">Faculty Name *</label>
                    <input
                      type="text"
                      className="fmg-input"
                      placeholder="e.g., Faculty of Computing"
                      value={courseData.faculty_name}
                      onChange={(e) => setCourseData({ ...courseData, faculty_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fmg-label">Assign to Stream (Optional)</label>
                    <select
                      className="fmg-input"
                      value={courseData.stream_id}
                      onChange={(e) => setCourseData({ ...courseData, stream_id: e.target.value })}
                      disabled={loading}
                    >
                      <option value="">No stream assigned</option>
                      {streams.map((stream) => (
                        <option key={stream.id} value={stream.id}>
                          {stream.stream_name} ({stream.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-fmg-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {editingCourse ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editingCourse ? <Edit3 size={18} className="me-2" /> : <PlusCircle size={18} className="me-2" />}
                        {editingCourse ? 'Update Course' : 'Create Course'}
                      </>
                    )}
                  </button>
                  <button type="button" className="btn btn-fmg-outline" onClick={handleCancelEdit} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="fmg-card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="fmg-search-box">
                  <Search size={20} />
                  <input
                    type="text"
                    className="fmg-search-input"
                    placeholder="Search courses by code, name, or faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="fmg-label">Filter by Stream</label>
                <select
                  className="fmg-input"
                  value={filterStream}
                  onChange={(e) => setFilterStream(e.target.value)}
                >
                  <option value="">All Streams</option>
                  {streams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.stream_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 text-end">
                <span className="text-muted">
                  Showing {filteredCourses.length} of {courses.length} courses
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="fmg-card">
          <div className="fmg-card-header">
            <h3 className="fmg-card-title mb-0">All Courses</h3>
            <span className="fmg-badge fmg-badge-teal">{courses.length} courses</span>
          </div>
          <div className="card-body p-0">
            {filteredCourses.length > 0 ? (
              <div className="table-responsive">
                <table className="fmg-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Faculty</th>
                      <th>Stream</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => {
                      const stream = streams.find(s => s.id === course.stream_id);
                      return (
                        <tr key={course.id}>
                          <td>
                            <strong className="fmg-course-code">{course.course_code}</strong>
                          </td>
                          <td>
                            <div>
                              <div className="fw-semibold">{course.course_name}</div>
                              <small className="text-muted">ID: {course.id}</small>
                            </div>
                          </td>
                          <td>
                            <span className="fmg-faculty-badge">{course.faculty_name}</span>
                          </td>
                          <td>
                            {stream ? (
                              <div className="d-flex align-items-center gap-2">
                                <Layers size={16} className="text-muted" />
                                <span>{stream.stream_name}</span>
                              </div>
                            ) : (
                              <span className="text-muted">Not assigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`fmg-status-badge ${stream ? 'fmg-status-active' : 'fmg-status-inactive'}`}>
                              {stream ? 'Assigned' : 'Unassigned'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleEditCourse(course)}
                                className="btn btn-fmg-outline btn-sm"
                                disabled={loading}
                                title="Edit Course"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="btn btn-fmg-danger btn-sm"
                                disabled={loading}
                                title="Delete Course"
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
              <div className="fmg-empty-state">
                <BookOpen size={48} className="text-muted mb-2" />
                <p className="text-muted">
                  {searchTerm || filterStream ? 'No courses found matching your criteria' : 'No courses created yet'}
                </p>
                {!searchTerm && !filterStream && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-fmg-primary"
                  >
                    <PlusCircle size={18} className="me-2" />
                    Create First Course
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="alert fmg-alert-info mt-4" role="alert">
          <h6 className="alert-heading d-flex align-items-center gap-2">
            <BookOpen size={20} />
            Course Management Tips
          </h6>
          <ul className="mb-0 ps-3">
            <li>Course codes should be unique and follow your institution's naming convention</li>
            <li>Assign courses to streams to organize them by academic program</li>
            <li>Courses without stream assignments can still be enrolled in by students</li>
            <li>Use the stream filter to view courses by specific academic programs</li>
          </ul>
        </div>
      </div>
    </Dashboard>
  );
}