import { useEffect, useState } from "react";
import api from "../../api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/FMG.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { 
  Users, BookOpen, Layers, PlusCircle, UserPlus, Award, 
  TrendingUp, Download, CheckCircle2, FileText
} from "lucide-react";

export default function FMGDashboard() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [enrollData, setEnrollData] = useState({
    student_id: "",
    course_id: ""
  });

  const [newStream, setNewStream] = useState({
    id: "",
    stream_name: "",
    prl_id: ""
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
      const [usersRes, coursesRes, streamsRes, enrollmentsRes] = await Promise.all([
        api.get("/users"),
        api.get("/courses"),
        api.get("/streams"),
        api.get("/enrollments")
      ]);

      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setStreams(streamsRes.data);
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
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to enroll student: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStream(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/streams", {
        id: newStream.id,
        stream_name: newStream.stream_name,
        prl_id: newStream.prl_id || null
      });
      setMessage("✅ Stream created successfully!");
      setNewStream({ id: "", stream_name: "", prl_id: "" });
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to create stream: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  const exportAllDataToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    const students = users.filter(u => u.role === "student");
    const studentsData = students.map(student => ({
      'Student ID': student.id,
      'Name': student.full_name,
      'Email': student.email,
      'Staff/Student ID': student.staff_student_id
    }));
    const studentsWorksheet = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, studentsWorksheet, 'Students');
    
    const coursesData = courses.map(course => ({
      'Course Code': course.course_code,
      'Course Name': course.course_name,
      'Faculty': course.faculty_name,
      'Stream ID': course.stream_id
    }));
    const coursesWorksheet = XLSX.utils.json_to_sheet(coursesData);
    XLSX.utils.book_append_sheet(workbook, coursesWorksheet, 'Courses');
    
    const streamsData = streams.map(stream => {
      const prl = users.find(u => u.id === stream.prl_id);
      return {
        'Stream ID': stream.id,
        'Stream Name': stream.stream_name,
        'PRL': prl ? prl.full_name : 'Not assigned'
      };
    });
    const streamsWorksheet = XLSX.utils.json_to_sheet(streamsData);
    XLSX.utils.book_append_sheet(workbook, streamsWorksheet, 'Streams');
    
    const enrollmentsData = enrollments.map(enrollment => {
      const student = users.find(u => u.id === enrollment.student_id);
      const course = courses.find(c => c.id === enrollment.course_id);
      return {
        'Student': student?.full_name || enrollment.student_id,
        'Course': course?.course_code || enrollment.course_id,
        'Enrollment Date': new Date(enrollment.enrollment_date).toLocaleDateString()
      };
    });
    const enrollmentsWorksheet = XLSX.utils.json_to_sheet(enrollmentsData);
    XLSX.utils.book_append_sheet(workbook, enrollmentsWorksheet, 'Enrollments');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(dataBlob, `faculty_manager_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
    setMessage("✅ All data exported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const students = users.filter(u => u.role === "student");
  const prls = users.filter(u => u.role === "prl");

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
        {/* Hero Header */}
        <div className="fmg-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="fmg-icon">
                  <Users size={48} />
                </div>
                <div>
                  <h1 className="fmg-title mb-1">Faculty Manager Dashboard</h1>
                  <p className="fmg-subtitle mb-0">Manage enrollments, streams, and faculty operations</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button
                onClick={exportAllDataToExcel}
                className="btn btn-fmg-light btn-lg shadow-sm"
              >
                <Download size={20} className="me-2" />
                Export All Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-purple">
              <div className="fmg-stat-icon">
                <Users size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{students.length}</div>
                <div className="fmg-stat-label">Total Students</div>
                <div className="fmg-stat-trend">
                  <TrendingUp size={16} />
                  <span>Enrolled</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-teal">
              <div className="fmg-stat-icon">
                <BookOpen size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{courses.length}</div>
                <div className="fmg-stat-label">Active Courses</div>
                <div className="fmg-stat-trend">
                  <CheckCircle2 size={16} />
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-indigo">
              <div className="fmg-stat-icon">
                <Layers size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{streams.length}</div>
                <div className="fmg-stat-label">Academic Streams</div>
                <div className="fmg-stat-trend">
                  <Award size={16} />
                  <span>Programs</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="fmg-stat-card fmg-stat-pink">
              <div className="fmg-stat-icon">
                <Award size={32} />
              </div>
              <div className="fmg-stat-content">
                <div className="fmg-stat-value">{enrollments.length}</div>
                <div className="fmg-stat-label">Total Enrollments</div>
                <div className="fmg-stat-trend">
                  <TrendingUp size={16} />
                  <span>Registered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`alert ${message.includes('✅') ? 'fmg-alert-success' : 'fmg-alert-danger'} alert-dismissible fade show fmg-alert mb-4`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Enroll Student - Full Width */}
        <div className="mb-4">
          <div className="fmg-card">
            <div className="fmg-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="fmg-header-icon fmg-icon-purple">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="fmg-card-title mb-0">Enroll Student in Course</h3>
                  <p className="fmg-card-subtitle mb-0">Add students to courses quickly</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleEnrollStudent}>
                <div className="row g-4 align-items-end">
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

                  <div className="col-md-2">
                    <button type="submit" className="btn btn-fmg-primary btn-lg w-100" disabled={loading}>
                      {loading ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <>
                          <UserPlus size={18} className="me-2" />
                          Enroll
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Create Stream - Full Width */}
        <div className="mb-4">
          <div className="fmg-card">
            <div className="fmg-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="fmg-header-icon fmg-icon-teal">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="fmg-card-title mb-0">Create New Stream</h3>
                  <p className="fmg-card-subtitle mb-0">Create academic stream and assign PRL</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateStream}>
                <div className="row g-4">
                  <div className="col-md-3">
                    <label className="fmg-label">Stream ID *</label>
                    <input
                      type="text"
                      className="fmg-input"
                      placeholder="e.g., STR001"
                      value={newStream.id}
                      onChange={(e) => setNewStream({ ...newStream, id: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="fmg-label">Stream Name *</label>
                    <input
                      type="text"
                      className="fmg-input"
                      placeholder="e.g., Computer Science Stream"
                      value={newStream.stream_name}
                      onChange={(e) => setNewStream({ ...newStream, stream_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="fmg-label">Assign PRL (Optional)</label>
                    <select
                      className="fmg-input"
                      value={newStream.prl_id}
                      onChange={(e) => setNewStream({ ...newStream, prl_id: e.target.value })}
                      disabled={loading}
                    >
                      <option value="">No PRL assigned</option>
                      {prls.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.staff_student_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="fmg-label d-block">&nbsp;</label>
                    <button type="submit" className="btn btn-fmg-secondary btn-lg w-100" disabled={loading}>
                      {loading ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <>
                          <PlusCircle size={18} className="me-2" />
                          Create
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <div className="fmg-quick-stats mt-4">
                <div className="fmg-stats-grid">
                  <div className="fmg-stats-item">
                    <div className="fmg-stats-emoji">📚</div>
                    <div>
                      <div className="fmg-stats-number">{courses.length}</div>
                      <div className="fmg-stats-text">Total Courses</div>
                    </div>
                  </div>
                  <div className="fmg-stats-item">
                    <div className="fmg-stats-emoji">👨‍🏫</div>
                    <div>
                      <div className="fmg-stats-number">{prls.length}</div>
                      <div className="fmg-stats-text">PRLs Available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="row g-4 mb-4">
          {/* All Streams */}
          <div className="col-lg-6">
            <div className="fmg-card">
              <div className="fmg-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="fmg-header-icon fmg-icon-indigo">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h3 className="fmg-card-title mb-0">All Streams</h3>
                    <p className="fmg-card-subtitle mb-0">Academic streams overview</p>
                  </div>
                </div>
                <span className="fmg-badge fmg-badge-teal">{streams.length} streams</span>
              </div>
              <div className="card-body p-0">
                {streams.length > 0 ? (
                  <div className="table-responsive">
                    <table className="fmg-table">
                      <thead>
                        <tr>
                          <th>Stream ID</th>
                          <th>Name</th>
                          <th>PRL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {streams.slice(0, 5).map((s) => {
                          const prl = users.find(u => u.id === s.prl_id);
                          return (
                            <tr key={s.id}>
                              <td>
                                <span className="fmg-stream-badge">{s.id}</span>
                              </td>
                              <td>{s.stream_name}</td>
                              <td>{prl ? prl.full_name : <span className="text-muted">Not assigned</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="fmg-empty-state">
                    <Layers size={48} className="text-muted mb-2" />
                    <p className="text-muted">No streams created yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="col-lg-6">
            <div className="fmg-card">
              <div className="fmg-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="fmg-header-icon fmg-icon-pink">
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 className="fmg-card-title mb-0">Recent Enrollments</h3>
                    <p className="fmg-card-subtitle mb-0">Latest student registrations</p>
                  </div>
                </div>
                <span className="fmg-badge fmg-badge-pink">{enrollments.length}</span>
              </div>
              <div className="card-body p-0">
                {enrollments.length > 0 ? (
                  <div className="table-responsive">
                    <table className="fmg-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.slice(0, 5).map((e) => {
                          const student = users.find(u => u.id === e.student_id);
                          const course = courses.find(c => c.id === e.course_id);
                          return (
                            <tr key={e.id}>
                              <td>{student?.full_name || `ID: ${e.student_id}`}</td>
                              <td>
                                <span className="fmg-course-badge">{course?.course_code || `ID: ${e.course_id}`}</span>
                              </td>
                              <td className="text-muted small">
                                {new Date(e.enrollment_date).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="fmg-empty-state">
                    <Award size={48} className="text-muted mb-2" />
                    <p className="text-muted">No enrollments yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert fmg-alert-info" role="alert">
          <h6 className="alert-heading d-flex align-items-center gap-2">
            <FileText size={20} />
            System Information
          </h6>
          <p className="mb-0">
            <strong>Note:</strong> Program Leaders (PL) don't need stream assignments. They manage all courses. 
            Only PRLs (Principal Lecturers) are assigned to specific streams. Create a stream above and select a PRL to assign them automatically.
          </p>
        </div>
      </div>
    </Dashboard>
  );
}