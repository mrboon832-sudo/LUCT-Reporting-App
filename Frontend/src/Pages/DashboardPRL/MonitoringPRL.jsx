import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from '../../Api/api';
import Dashboard from '../../Components/Dashboard';
import '../../CSS/Dashboard.css'; 
import "../../CSS/PRL.css";
import { 
  Eye, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BookOpen,
  BarChart3,
  Download,
  FileText,
  Star,
  RefreshCw,
  Home
} from "lucide-react"

export default function MonitoringPRL() {
  const [user, setUser] = useState(null)
  const [streamCourses, setStreamCourses] = useState([])
  const [reports, setReports] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    course: "all",
    status: "all",
    timeRange: "7"
  })

  const navigate = useNavigate()
  const location = useLocation()


  useEffect(() => {
    validateCurrentPath();
    initializeUserAndData();
  }, [navigate, location])

  const validateCurrentPath = () => {
    const validPaths = [
      '/prl',
      '/prl/courses', 
      '/prl/reports',
      '/prl/monitoring',
      '/prl/ratings'
    ];
    
    const currentPath = location.pathname;
   
    if (!validPaths.includes(currentPath)) {
      console.warn(`Invalid path detected: ${currentPath}. Redirecting to /prl`);
      navigate('/prl', { replace: true });
      return;
    }
  }

  const initializeUserAndData = () => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        console.log("User found:", parsed)
        setUser(parsed)
        fetchData(parsed.id)
      } catch (err) {
        console.error("Error parsing user data:", err)
        setError("Invalid user data in localStorage")
        setLoading(false)
        setTimeout(() => navigate("/login", { replace: true }), 2000)
      }
    } else {
      console.error("No user found in localStorage")
      setError("No user found. Please log in.")
      setLoading(false)
      setTimeout(() => navigate("/login", { replace: true }), 2000)
    }
  }

  async function fetchData(prlId) {
    if (!prlId) {
      console.error("No PRL ID provided")
      setError("User ID not found")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log("Starting data fetch for PRL:", prlId)
      
     
      const requests = [
        api.get("/streams").catch(err => {
          console.error("Error fetching streams:", err)
          return { data: [] }
        }),
        api.get("/courses").catch(err => {
          console.error("Error fetching courses:", err)
          return { data: [] }
        }),
        api.get("/reports").catch(err => {
          console.error("Error fetching reports:", err)
          return { data: [] }
        }),
        api.get("/ratings").catch(err => {
          console.error("Error fetching ratings:", err)
          return { data: [] }
        })
      ]

      const [streamsRes, coursesRes, reportsRes, ratingsRes] = await Promise.all(requests)

     
      console.log("API Responses:", {
        streams: streamsRes.data,
        courses: coursesRes.data,
        reports: reportsRes.data,
        ratings: ratingsRes.data
      })

      
      const streamsData = Array.isArray(streamsRes.data) ? streamsRes.data : []
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : []
      const reportsData = Array.isArray(reportsRes.data) ? reportsRes.data : []
      const ratingsData = Array.isArray(ratingsRes.data) ? ratingsRes.data : []


      const myStream = streamsData.find((s) => s && s.prl_id == prlId)
      console.log("My Stream:", myStream)

      if (!myStream) {
        console.warn("No stream found for PRL ID:", prlId)
        console.log("Available streams:", streamsData)
        setError("No stream assigned to your account. Please contact administrator.")
        setStreamCourses([])
      } else {
    
        const filteredCourses = coursesData.filter(
          (c) => c && c.stream_id == myStream.id
        )
        console.log("Filtered courses:", filteredCourses)
        setStreamCourses(filteredCourses || [])
      }

      setReports(reportsData)
      setRatings(ratingsData)
      
    } catch (err) {
      console.error("Unexpected error fetching data:", err)
      setError("Failed to load monitoring data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }


  const getCourseMetrics = (courseId) => {
    if (!courseId) {
      return getDefaultMetrics()
    }

    const courseReports = (reports || []).filter(r => r && r.course_id == courseId)
    const courseRatings = (ratings || []).filter(r => r && r.course_id == courseId)
    
    const totalReports = courseReports.length
    const avgRating = courseRatings.length > 0 
      ? (courseRatings.reduce((sum, r) => sum + parseFloat(r.rating || 0), 0) / courseRatings.length).toFixed(1)
      : "0.0"
    
    const recentReports = courseReports.filter(report => {
      if (!report || !report.created_at) return false
      try {
        const reportDate = new Date(report.created_at)
   
        if (isNaN(reportDate.getTime())) return false
        
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(filters.timeRange || 7))
        
        return reportDate > cutoffDate
      } catch (error) {
        console.error('Error parsing date:', report?.created_at, error)
        return false
      }
    }).length

 
    const engagementRate = totalReports > 0 
      ? Math.min((recentReports / totalReports) * 2, 1) 
      : 0

    const engagementLabel = engagementRate >= 0.8 ? 'High' : 
                           engagementRate >= 0.5 ? 'Normal' : 'Low'

    return {
      totalReports,
      avgRating,
      recentReports,
      engagementRate: engagementLabel,
      engagementPercentage: (engagementRate * 100).toFixed(0),
  
      status: totalReports > 0 ? 'active' : 'inactive'
    }
  }

  const getDefaultMetrics = () => ({
    totalReports: 0,
    avgRating: "0.0",
    recentReports: 0,
    engagementRate: 'Low',
    engagementPercentage: "0",
    status: 'inactive'
  })

  const getPerformanceStatus = (metrics) => {
    const rating = parseFloat(metrics.avgRating || 0)
    if (rating >= 4.5) return 'excellent'
    if (rating >= 4.0) return 'good'
    if (rating >= 3.0) return 'fair'
    return 'needs_attention'
  }

  const filteredCourses = (streamCourses || []).filter(course => {
    if (!course || !course.id) return false
    const metrics = getCourseMetrics(course.id)
    const matchesCourse = filters.course === "all" || course.id.toString() === filters.course.toString()
    const matchesStatus = filters.status === "all" || metrics.status === filters.status
    return matchesCourse && matchesStatus
  })

  const overallStats = {
    totalCourses: (streamCourses || []).length,
    activeCourses: (streamCourses || []).filter(course => {
      const metrics = getCourseMetrics(course.id)
      return metrics.status === 'active'
    }).length,
    totalReports: (reports || []).length,
    avgRating: (ratings || []).length > 0 
      ? ((ratings || []).reduce((sum, r) => sum + parseFloat(r.rating || 0), 0) / (ratings || []).length).toFixed(1)
      : "0.0"
  }

  const handleExportReport = () => {
    console.log("Exporting report...")
    alert("Export functionality would be implemented here")
  }

  const handleViewReports = (courseId) => {
    navigate('/prl/reports', { 
      replace: true,
      state: { 
        courseId: courseId,
        fromMonitoring: true 
      } 
    });
    
    console.log("Navigating to reports for course:", courseId);
  }

  const handleGoToDashboard = () => {
    navigate('/prl', { replace: true });
  }

  const handleRetry = () => {
    if (user?.id) {
      fetchData(user.id)
    } else {
      initializeUserAndData()
    }
  }

  if (location.pathname !== '/prl/monitoring') {
    return (
      <Dashboard user={user}>
        <div className="prl-dashboard">
          <div className="alert alert-warning text-center">
            <AlertCircle size={24} className="mb-2" />
            <h5>Invalid Path</h5>
            <p>You've navigated to an invalid path. Redirecting...</p>
            <button 
              className="btn btn-primary mt-2"
              onClick={handleGoToDashboard}
            >
              <Home size={16} className="me-2" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </Dashboard>
    );
  }

  if (loading && !user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading Dashboard...</h5>
          <p className="text-muted">Please wait while we initialize your session</p>
        </div>
      </div>
    )
  }

  return (
    <Dashboard user={user}>
      <div className="prl-dashboard">
        {error && (
          <div className={`alert alert-danger alert-dismissible fade show mb-4`} role="alert">
            <div className="d-flex align-items-center">
              <AlertCircle size={20} className="me-2 flex-shrink-0" />
              <div className="flex-grow-1">
                {error}
                <div className="mt-2">
                  <button 
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={handleRetry}
                  >
                    <RefreshCw size={14} className="me-1" />
                    Retry
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="prl-hero mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="prl-icon">
                  <Eye size={48} />
                </div>
                <div>
                  <h1 className="prl-title mb-1">Course Monitoring</h1>
                  <p className="prl-subtitle mb-0">
                    {user ? `Welcome, ${user.name || user.email}` : 'Monitor academic performance and course activities'}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button 
                className="btn btn-light btn-lg shadow-sm"
                onClick={handleExportReport}
                disabled={loading}
              >
                <Download size={20} className="me-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>


        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="prl-stat-card prl-stat-blue">
              <div className="stat-icon-prl">
                <BookOpen size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{overallStats.totalCourses}</div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>Under Monitoring</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="prl-stat-card prl-stat-green">
              <div className="stat-icon-prl">
                <CheckCircle size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{overallStats.activeCourses}</div>
                <div className="stat-label">Active Courses</div>
                <div className="stat-trend">
                  <BarChart3 size={16} />
                  <span>Recent Activity</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="prl-stat-card prl-stat-orange">
              <div className="stat-icon-prl">
                <FileText size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{overallStats.totalReports}</div>
                <div className="stat-label">Total Reports</div>
                <div className="stat-trend">
                  <Clock size={16} />
                  <span>Submitted</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="prl-stat-card prl-stat-yellow">
              <div className="stat-icon-prl">
                <Star size={32} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{overallStats.avgRating}</div>
                <div className="stat-label">Avg Rating</div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                  <span>Performance</span>
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
                  disabled={loading || streamCourses.length === 0}
                >
                  <option value="all">All Courses</option>
                  {streamCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="prl-label">Activity Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="prl-input"
                  disabled={loading}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="prl-label">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="prl-input"
                  disabled={loading}
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

       
        <div className="prl-card">
          <div className="prl-card-header">
            <div className="d-flex align-items-center gap-2">
              <div className="header-icon-prl header-icon-purple">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="prl-card-title mb-0">Course Performance Monitoring</h3>
                <p className="prl-card-subtitle mb-0">Real-time tracking of course activities and performance</p>
              </div>
            </div>
            <span className="prl-badge prl-badge-purple">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5>Loading Monitoring Data</h5>
                <p className="text-muted">Fetching courses, reports, and analytics...</p>
              </div>
            ) : error ? (
              <div className="text-center py-5">
                <AlertCircle size={48} className="text-danger mb-3" />
                <h5>Unable to Load Data</h5>
                <p className="text-danger mb-3">{error}</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleRetry}
                >
                  <RefreshCw size={16} className="me-2" />
                  Retry Loading
                </button>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="monitoring-grid">
                {filteredCourses.map((course) => {
                  const metrics = getCourseMetrics(course.id)
                  const performanceStatus = getPerformanceStatus(metrics)
                  
                  return (
                    <div key={course.id} className="monitoring-card">
                      <div className="monitoring-header">
                        <div className="course-info">
                          <span className="course-code">{course.course_code || 'N/A'}</span>
                          <h5 className="course-name">{course.course_name || 'Unnamed Course'}</h5>
                        </div>
                        <div className={`status-indicator ${metrics.status}`}>
                          {metrics.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      
                      <div className="performance-metrics">
                        <div className="metric-row">
                          <div className="metric">
                            <div className="metric-icon">📊</div>
                            <div className="metric-info">
                              <div className="metric-value">{metrics.totalReports}</div>
                              <div className="metric-label">Total Reports</div>
                            </div>
                          </div>
                          <div className="metric">
                            <div className="metric-icon">⭐</div>
                            <div className="metric-info">
                              <div className="metric-value">{metrics.avgRating}</div>
                              <div className="metric-label">Avg Rating</div>
                            </div>
                          </div>
                        </div>
                        <div className="metric-row">
                          <div className="metric">
                            <div className="metric-icon">🕒</div>
                            <div className="metric-info">
                              <div className="metric-value">{metrics.recentReports}</div>
                              <div className="metric-label">Recent Reports</div>
                            </div>
                          </div>
                          <div className="metric">
                            <div className="metric-icon">👥</div>
                            <div className="metric-info">
                              <div className="metric-value">{metrics.engagementRate}</div>
                              <div className="metric-label">Engagement</div>
                              {metrics.engagementPercentage && (
                                <small className="text-muted">{metrics.engagementPercentage}%</small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="performance-status">
                        <div className={`performance-badge ${performanceStatus}`}>
                          {performanceStatus === 'excellent' && <CheckCircle size={14} />}
                          {performanceStatus === 'good' && <TrendingUp size={14} />}
                          {performanceStatus === 'fair' && <Clock size={14} />}
                          {performanceStatus === 'needs_attention' && <AlertCircle size={14} />}
                          <span>
                            {performanceStatus === 'excellent' && 'Excellent'}
                            {performanceStatus === 'good' && 'Good'}
                            {performanceStatus === 'fair' && 'Fair'}
                            {performanceStatus === 'needs_attention' && 'Needs Attention'}
                          </span>
                        </div>
                      </div>

                      <div className="monitoring-actions">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewReports(course.id)}
                        >
                          <FileText size={16} className="me-1" />
                          View Reports
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state-table text-center py-5">
                <BarChart3 size={48} className="text-muted mb-3" />
                <h5>No Courses Found</h5>
                <p className="text-muted mb-3">
                  {streamCourses.length === 0 
                    ? "No courses are currently assigned to your stream." 
                    : "No courses match your current filters."}
                </p>
                {streamCourses.length === 0 ? (
                  <button className="btn btn-primary" onClick={handleRetry}>
                    <RefreshCw size={16} className="me-2" />
                    Check Again
                  </button>
                ) : (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setFilters({ course: "all", status: "all", timeRange: "7" })}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  )
}