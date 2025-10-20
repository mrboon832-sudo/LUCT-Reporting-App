// src/Pages/FMG/Streams.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/FMG.css";
import { 
  Layers, PlusCircle, Edit3, Trash2, ArrowLeft, Search, Users, X
} from "lucide-react";

export default function StreamsManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [streams, setStreams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStream, setEditingStream] = useState(null);

  const [streamData, setStreamData] = useState({
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
      const [usersRes, streamsRes, coursesRes] = await Promise.all([
        api.get("/users"),
        api.get("/streams"),
        api.get("/courses")
      ]);
      setUsers(usersRes.data);
      setStreams(streamsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setMessage("❌ Error loading data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStream(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/streams", {
        id: streamData.id,
        stream_name: streamData.stream_name,
        prl_id: streamData.prl_id || null
      });
      setMessage("✅ Stream created successfully!");
      setStreamData({ id: "", stream_name: "", prl_id: "" });
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to create stream: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStream(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/streams/${editingStream.id}`, {
        stream_name: streamData.stream_name,
        prl_id: streamData.prl_id || null
      });
      setMessage("✅ Stream updated successfully!");
      setStreamData({ id: "", stream_name: "", prl_id: "" });
      setEditingStream(null);
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update stream: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStream(streamId) {
    if (!window.confirm("Are you sure you want to delete this stream? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/streams/${streamId}`);
      setMessage("✅ Stream deleted successfully!");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete stream: " + (err.response?.data?.error || err.message));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  function handleEditStream(stream) {
    setEditingStream(stream);
    setStreamData({
      id: stream.id,
      stream_name: stream.stream_name,
      prl_id: stream.prl_id || ""
    });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingStream(null);
    setStreamData({ id: "", stream_name: "", prl_id: "" });
    setShowForm(false);
  }

  const prls = users.filter(u => u.role === "prl");
  const filteredStreams = streams.filter(stream =>
    stream.stream_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <Layers size={48} />
                </div>
                <div>
                  <h1 className="fmg-title mb-1">Streams Management</h1>
                  <p className="fmg-subtitle mb-0">Create, edit, and manage academic streams</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingStream(null);
                  setStreamData({ id: "", stream_name: "", prl_id: "" });
                }}
                className="btn btn-fmg-primary btn-lg"
                disabled={loading}
              >
                <PlusCircle size={20} className="me-2" />
                Create Stream
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

        {/* Stream Form - Full Width */}
        {showForm && (
          <div className="fmg-card mb-4">
            <div className="fmg-card-header">
              <div className="d-flex align-items-center justify-content-between">
                <h3 className="fmg-card-title mb-0">
                  {editingStream ? 'Edit Stream' : 'Create New Stream'}
                </h3>
                <button onClick={handleCancelEdit} className="btn btn-sm btn-light">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={editingStream ? handleUpdateStream : handleCreateStream}>
                <div className="row g-4">
                  {!editingStream && (
                    <div className="col-md-4">
                      <label className="fmg-label">Stream ID *</label>
                      <input
                        type="text"
                        className="fmg-input"
                        placeholder="e.g., STR001"
                        value={streamData.id}
                        onChange={(e) => setStreamData({ ...streamData, id: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  )}
                  <div className={editingStream ? "col-md-6" : "col-md-4"}>
                    <label className="fmg-label">Stream Name *</label>
                    <input
                      type="text"
                      className="fmg-input"
                      placeholder="e.g., Computer Science Stream"
                      value={streamData.stream_name}
                      onChange={(e) => setStreamData({ ...streamData, stream_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className={editingStream ? "col-md-4" : "col-md-4"}>
                    <label className="fmg-label">Assign PRL (Optional)</label>
                    <select
                      className="fmg-input"
                      value={streamData.prl_id}
                      onChange={(e) => setStreamData({ ...streamData, prl_id: e.target.value })}
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
                  <div className={editingStream ? "col-md-2" : "col-12"}>
                    <label className="fmg-label d-block">&nbsp;</label>
                    <button type="submit" className="btn btn-fmg-primary btn-lg w-100" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {editingStream ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          {editingStream ? <Edit3 size={18} className="me-2" /> : <PlusCircle size={18} className="me-2" />}
                          {editingStream ? 'Update' : 'Create'}
                        </>
                      )}
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
                className="fmg-input"
                placeholder="Search streams by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Streams Table */}
        <div className="fmg-card">
          <div className="fmg-card-header">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h3 className="fmg-card-title mb-0">All Streams</h3>
                <p className="fmg-card-subtitle mb-0">View and manage academic streams</p>
              </div>
              <span className="fmg-badge">
                Showing {filteredStreams.length} of {streams.length}
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
            ) : filteredStreams.length > 0 ? (
              <div className="table-responsive">
                <table className="fmg-table">
                  <thead>
                    <tr>
                      <th>Stream ID</th>
                      <th>Stream Name</th>
                      <th>PRL</th>
                      <th>Courses Count</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStreams.map((stream) => {
                      const prl = users.find(u => u.id === stream.prl_id);
                      const streamCourses = courses.filter(c => c.stream_id === stream.id);
                      return (
                        <tr key={stream.id}>
                          <td>
                            <span className="fmg-badge-light">{stream.id}</span>
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
                            <span className="badge bg-info-subtle text-info">
                              {streamCourses.length} courses
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleEditStream(stream)}
                                className="btn btn-sm btn-warning"
                                title="Edit stream"
                                disabled={loading}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStream(stream.id)}
                                className="btn btn-sm btn-danger"
                                title="Delete stream"
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
                <Layers size={64} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {searchTerm ? 'No streams found matching your search' : 'No streams created yet'}
                </h5>
                <p className="text-muted small">
                  {searchTerm 
                    ? 'Try adjusting your search criteria' 
                    : 'Click "Create Stream" to add your first academic stream'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}