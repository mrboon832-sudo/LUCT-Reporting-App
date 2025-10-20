// src/Pages/FMG/Monitoring.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/FMG.css";
import { 
  Activity, Server, Users, BookOpen, Layers, UserPlus, Award,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle,
  ArrowLeft, RefreshCw, Clock, BarChart3, Eye, Download,
  Calendar, Filter, Search
} from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function FMGMonitoring() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

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
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }

  const exportMonitoringReport = () => {
    const workbook = XLSX.utils.book_new();
    
    // System Overview Sheet
    const overviewData = [
      ['Metric', 'Count', 'Status'],
      ['Total Users', users.length, 'Active'],
      ['Total Students', students.length, 'Active'],
      ['Total Courses', courses.length, 'Active'],
      ['Total Streams', streams.length, 'Active'],
      ['Total Enrollments', enrollments.length, 'Active'],
      ['Courses without Streams', coursesWithoutStream, 'Needs Attention'],
      ['Streams without PRL', streamsWithoutPRL, 'Needs Attention'],
      ['System Status', 'Operational', 'Good'],
      ['Last Data Refresh', lastUpdated?.toLocaleString(), 'Current']
    ];
    const overviewWorksheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewWorksheet, 'System Overview');

    // Recent Activity Sheet
    const activityData = recentActivity.map(activity => ({
      'Timestamp': activity.timestamp,
      'Type': activity.type,
      'Description': activity.description,
      'Status': activity.status
    }));
    const activityWorksheet = XLSX.utils.json_to_sheet(activityData);
    XLSX.utils.book_append_sheet(workbook, activityWorksheet, 'Recent Activity');

    // Issues Sheet
    const issuesData = systemIssues.map(issue => ({
      'Severity': issue.severity,
      'Type': issue.type,
      'Description': issue.description,
      'Affected Items': issue.affectedItems,
      'Recommendation': issue.recommendation
    }));
    const issuesWorksheet = XLSX.utils.json_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(workbook, issuesWorksheet, 'System Issues');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(dataBlob, `system_monitoring_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Data calculations
  const students = users.filter(u => u.role === "student");
  const prls = users.filter(u => u.role === "prl");
  const pls = users.filter(u => u.role === "pl");
  const coursesWithoutStream = courses.filter(c => !c.stream_id).length;
  const streamsWithoutPRL = streams.filter(s => !s.prl_id).length;

  // Recent enrollments (last 7 days)
  const recentEnrollments = enrollments
    .filter(e => new Date(e.enrollment_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .slice(0, 10);

  // System health metrics
  const systemHealth = {
    overall: coursesWithoutStream === 0 && streamsWithoutPRL === 0 ? 'healthy' : 'needs_attention',
    courses: coursesWithoutStream === 0 ? 'healthy' : 'needs_attention',
    streams: streamsWithoutPRL === 0 ? 'healthy' : 'needs_attention',
    enrollments: enrollments.length > 0 ? 'healthy' : 'needs_attention'
  };

  // Recent activity log
  const recentActivity = [
    {
      timestamp: new Date().toLocaleString(),
      type: 'Data Refresh',
      description: 'System data refreshed successfully',
      status: 'success'
    },
    ...recentEnrollments.map(enrollment => {
      const student = users.find(u => u.id === enrollment.student_id);
      const course = courses.find(c => c.id === enrollment.course_id);
      return {
        timestamp: new Date(enrollment.enrollment_date).toLocaleString(),
        type: 'Enrollment',
        description: `${student?.full_name || 'Unknown'} enrolled in ${course?.course_code || 'Unknown Course'}`,
        status: 'info'
      };
    }).slice(0, 5)
  ];

  // System issues
  const systemIssues = [
    ...(coursesWithoutStream > 0 ? [{
      severity: 'medium',
      type: 'Course Assignment',
      description: `${coursesWithoutStream} courses are not assigned to any stream`,
      affectedItems: `${coursesWithoutStream} courses`,
      recommendation: 'Assign courses to appropriate academic streams'
    }] : []),
    ...(streamsWithoutPRL > 0 ? [{
      severity: 'low',
      type: 'PRL Assignment',
      description: `${streamsWithoutPRL} streams do not have assigned PRLs`,
      affectedItems: `${streamsWithoutPRL} streams`,
      recommendation: 'Assign PRLs to manage these streams'
    }] : [])
  ];

  // Filter data based on search term
  const filteredData = {
    users: users.filter(u => 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    courses: courses.filter(c =>
      c.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    streams: streams.filter(s =>
      s.stream_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    enrollments: enrollments.filter(e => {
      const student = users.find(u => u.id === e.student_id);
      const course = courses.find(c => c.id === e.course_id);
      return (
        student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course?.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  };

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
                  <Activity size={48} />
                </div>
                <div>
                  <h1 className="fmg-title mb-1">System Monitoring</h1>
                  <p className="fmg-subtitle mb-0">Real-time system overview and analytics</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <div className="d-flex gap-2 justify-content-lg-end">
                <button
                  onClick={fetchData}
                  className="btn btn-fmg-outline"
                  disabled={loading}
                >
                  <RefreshCw size={18} className={loading ? "spin" : ""} />
                  {loading ? ' Refreshing...' : ' Refresh'}
                </button>
                <button
                  onClick={exportMonitoringReport}
                  className="btn btn-fmg-primary"
                >
                  <Download size={18} />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="alert fmg-alert-info mb-4">
            <div className="d-flex align-items-center gap-2">
              <Clock size={18} />
              <span>
                Last updated: {lastUpdated.toLocaleString()} 
                {loading && <span className="ms-2"> • Refreshing data...</span>}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="fmg-card mb-4">
          <div className="fmg-card-header">
            <div className="fmg-tabs">
              <button
                className={`fmg-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <BarChart3 size={18} />
                System Overview
              </button>
              <button
                className={`fmg-tab ${activeTab === "health" ? "active" : ""}`}
                onClick={() => setActiveTab("health")}
              >
                <Activity size={18} />
                System Health
              </button>
              <button
                className={`fmg-tab ${activeTab === "activity" ? "active" : ""}`}
                onClick={() => setActiveTab("activity")}
              >
                <Clock size={18} />
                Recent Activity
              </button>
              <button
                className={`fmg-tab ${activeTab === "data" ? "active" : ""}`}
                onClick={() => setActiveTab("data")}
              >
                <Eye size={18} />
                All Data
              </button>
            </div>
          </div>
        </div>

        {/* Search Box for Data Tab */}
        {activeTab === "data" && (
          <div className="fmg-card mb-4">
            <div className="card-body">
              <div className="fmg-search-box">
                <Search size={20} />
                <input
                  type="text"
                  className="fmg-search-input"
                  placeholder="Search across all data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="fmg-vertical-stack">
            {/* Key Metrics - Full Width Row */}
            <div className="fmg-card mb-4">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">System Metrics</h3>
                <span className="fmg-badge fmg-badge-teal">Live Data</span>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-lg-3 col-md-6">
                    <div className="fmg-stat-card fmg-stat-purple">
                      <div className="fmg-stat-icon">
                        <Users size={32} />
                      </div>
                      <div className="fmg-stat-content">
                        <div className="fmg-stat-value">{users.length}</div>
                        <div className="fmg-stat-label">Total Users</div>
                        <div className="fmg-stat-breakdown">
                          <span>{students.length} Students</span>
                          <span>{prls.length} PRLs</span>
                          <span>{pls.length} PLs</span>
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
                        <div className="fmg-stat-label">Courses</div>
                        <div className="fmg-stat-breakdown">
                          <span>{coursesWithoutStream} Unassigned</span>
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
                        <div className="fmg-stat-label">Streams</div>
                        <div className="fmg-stat-breakdown">
                          <span>{streamsWithoutPRL} Unassigned</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="fmg-stat-card fmg-stat-pink">
                      <div className="fmg-stat-icon">
                        <UserPlus size={32} />
                      </div>
                      <div className="fmg-stat-content">
                        <div className="fmg-stat-value">{enrollments.length}</div>
                        <div className="fmg-stat-label">Enrollments</div>
                        <div className="fmg-stat-breakdown">
                          <span>{recentEnrollments.length} Recent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status - Full Width Card */}
            <div className="fmg-card mb-4">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">System Status</h3>
                <div className={`fmg-status-indicator ${systemHealth.overview}`}>
                  {systemHealth.overview === 'healthy' ? 'All Systems Operational' : 'Needs Attention'}
                </div>
              </div>
              <div className="card-body">
                <div className="fmg-status-grid">
                  <div className={`fmg-status-item ${systemHealth.courses}`}>
                    <div className="fmg-status-icon">
                      <BookOpen size={20} />
                    </div>
                    <div className="fmg-status-content">
                      <div className="fmg-status-title">Courses</div>
                      <div className="fmg-status-description">
                        {coursesWithoutStream === 0 ? 'All courses assigned' : `${coursesWithoutStream} unassigned`}
                      </div>
                    </div>
                  </div>
                  <div className={`fmg-status-item ${systemHealth.streams}`}>
                    <div className="fmg-status-icon">
                      <Layers size={20} />
                    </div>
                    <div className="fmg-status-content">
                      <div className="fmg-status-title">Streams</div>
                      <div className="fmg-status-description">
                        {streamsWithoutPRL === 0 ? 'All streams managed' : `${streamsWithoutPRL} unmanaged`}
                      </div>
                    </div>
                  </div>
                  <div className={`fmg-status-item ${systemHealth.enrollments}`}>
                    <div className="fmg-status-icon">
                      <UserPlus size={20} />
                    </div>
                    <div className="fmg-status-content">
                      <div className="fmg-status-title">Enrollments</div>
                      <div className="fmg-status-description">
                        {enrollments.length > 0 ? 'Active enrollments' : 'No enrollments'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Enrollments - Full Width Card */}
            <div className="fmg-card">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">Recent Enrollments</h3>
                <span className="fmg-badge fmg-badge-pink">{recentEnrollments.length}</span>
              </div>
              <div className="card-body p-0">
                {recentEnrollments.length > 0 ? (
                  <div className="fmg-activity-list">
                    {recentEnrollments.map((enrollment, index) => {
                      const student = users.find(u => u.id === enrollment.student_id);
                      const course = courses.find(c => c.id === enrollment.course_id);
                      return (
                        <div key={enrollment.id} className="fmg-activity-item">
                          <div className="fmg-activity-icon">
                            <UserPlus size={16} />
                          </div>
                          <div className="fmg-activity-content">
                            <div className="fmg-activity-title">
                              {student?.full_name || 'Unknown Student'}
                            </div>
                            <div className="fmg-activity-description">
                              Enrolled in {course?.course_code || 'Unknown Course'}
                            </div>
                            <div className="fmg-activity-time">
                              {new Date(enrollment.enrollment_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="fmg-empty-state">
                    <UserPlus size={48} className="text-muted mb-2" />
                    <p className="text-muted">No recent enrollments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === "health" && (
          <div className="fmg-vertical-stack">
            {/* System Health Dashboard - Full Width Card */}
            <div className="fmg-card">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">System Health Dashboard</h3>
                <div className={`fmg-health-badge ${systemHealth.overview}`}>
                  {systemHealth.overview === 'healthy' ? 'Healthy' : 'Needs Attention'}
                </div>
              </div>
              <div className="card-body">
                {systemIssues.length > 0 ? (
                  <div className="fmg-issues-list">
                    {systemIssues.map((issue, index) => (
                      <div key={index} className={`fmg-issue-item fmg-issue-${issue.severity}`}>
                        <div className="fmg-issue-icon">
                          <AlertTriangle size={20} />
                        </div>
                        <div className="fmg-issue-content">
                          <div className="fmg-issue-title">{issue.type}</div>
                          <div className="fmg-issue-description">{issue.description}</div>
                          <div className="fmg-issue-meta">
                            <span className="fmg-issue-affected">{issue.affectedItems}</span>
                            <span className="fmg-issue-recommendation">{issue.recommendation}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="fmg-healthy-state text-center py-5">
                    <CheckCircle size={64} className="text-success mb-3" />
                    <h4 className="text-success">All Systems Operational</h4>
                    <p className="text-muted">No issues detected in the system.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Tab */}
        {activeTab === "activity" && (
          <div className="fmg-vertical-stack">
            {/* Recent System Activity - Full Width Card */}
            <div className="fmg-card">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">Recent System Activity</h3>
                <span className="fmg-badge fmg-badge-teal">{recentActivity.length} events</span>
              </div>
              <div className="card-body p-0">
                <div className="fmg-activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="fmg-activity-item">
                      <div className={`fmg-activity-icon fmg-activity-${activity.status}`}>
                        {activity.status === 'success' ? <CheckCircle size={16} /> : <Activity size={16} />}
                      </div>
                      <div className="fmg-activity-content">
                        <div className="fmg-activity-title">{activity.type}</div>
                        <div className="fmg-activity-description">{activity.description}</div>
                        <div className="fmg-activity-time">{activity.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Data Tab */}
        {activeTab === "data" && (
          <div className="fmg-vertical-stack">
            {/* Users Data - Full Width Card */}
            <div className="fmg-card mb-4">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">Users Data</h3>
                <span className="fmg-badge fmg-badge-purple">{filteredData.users.length} users</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="fmg-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Staff/Student ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.users.slice(0, 15).map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Users size={16} className="text-muted" />
                              <span>{user.full_name}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td><span className="fmg-role-badge">{user.role}</span></td>
                          <td><code>{user.staff_student_id}</code></td>
                          <td>
                            <span className="fmg-status-badge fmg-status-active">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Courses Data - Full Width Card */}
            <div className="fmg-card mb-4">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">Courses Data</h3>
                <span className="fmg-badge fmg-badge-teal">{filteredData.courses.length} courses</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="fmg-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Faculty</th>
                        <th>Stream</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.courses.slice(0, 15).map((course) => {
                        const stream = streams.find(s => s.id === course.stream_id);
                        return (
                          <tr key={course.id}>
                            <td>
                              <strong className="fmg-course-code">{course.course_code}</strong>
                            </td>
                            <td>{course.course_name}</td>
                            <td>{course.faculty_name}</td>
                            <td>
                              {stream ? (
                                <span className="fmg-stream-badge">{stream.stream_name}</span>
                              ) : (
                                <span className="text-muted">Not assigned</span>
                              )}
                            </td>
                            <td>
                              <span className={`fmg-status-badge ${stream ? 'fmg-status-active' : 'fmg-status-inactive'}`}>
                                {stream ? 'Assigned' : 'Unassigned'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Streams Data - Full Width Card */}
            <div className="fmg-card mb-4">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">Streams Data</h3>
                <span className="fmg-badge fmg-badge-indigo">{filteredData.streams.length} streams</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="fmg-table">
                    <thead>
                      <tr>
                        <th>Stream ID</th>
                        <th>Stream Name</th>
                        <th>PRL</th>
                        <th>Courses Count</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.streams.slice(0, 15).map((stream) => {
                        const prl = users.find(u => u.id === stream.prl_id);
                        const streamCourses = courses.filter(c => c.stream_id === stream.id);
                        return (
                          <tr key={stream.id}>
                            <td>
                              <span className="fmg-stream-id">{stream.id}</span>
                            </td>
                            <td>
                              <strong>{stream.stream_name}</strong>
                            </td>
                            <td>
                              {prl ? (
                                <div className="d-flex align-items-center gap-2">
                                  <Users size={16} className="text-muted" />
                                  <span>{prl.full_name}</span>
                                </div>
                              ) : (
                                <span className="text-muted">Not assigned</span>
                              )}
                            </td>
                            <td>
                              <span className="fmg-badge fmg-badge-outline">
                                {streamCourses.length} courses
                              </span>
                            </td>
                            <td>
                              <span className={`fmg-status-badge ${prl ? 'fmg-status-active' : 'fmg-status-inactive'}`}>
                                {prl ? 'Managed' : 'Unmanaged'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Enrollments Data - Full Width Card */}
            <div className="fmg-card">
              <div className="fmg-card-header">
                <h3 className="fmg-card-title mb-0">Enrollments Data</h3>
                <span className="fmg-badge fmg-badge-pink">{filteredData.enrollments.length} enrollments</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="fmg-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Enrollment Date</th>
                        <th>Student ID</th>
                        <th>Course Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.enrollments.slice(0, 15).map((enrollment) => {
                        const student = users.find(u => u.id === enrollment.student_id);
                        const course = courses.find(c => c.id === enrollment.course_id);
                        return (
                          <tr key={enrollment.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Users size={16} className="text-muted" />
                                <span>{student?.full_name || 'Unknown Student'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <BookOpen size={16} className="text-muted" />
                                <span>{course?.course_name || 'Unknown Course'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Calendar size={16} className="text-muted" />
                                <span>{new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td>
                              <code>{student?.staff_student_id || 'N/A'}</code>
                            </td>
                            <td>
                              <code>{course?.course_code || 'N/A'}</code>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  );
}