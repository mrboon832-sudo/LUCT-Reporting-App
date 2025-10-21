import { useEffect, useState } from "react";
import api from "../../Api/api";
import Dashboard from "../../Components/Dashboard";
import "../../CSS/Dashboard.css";
import "../../CSS/Student.css";
import { Star, Send, CheckCircle, AlertCircle, MessageSquare, Edit, Trash2, X, Save } from "lucide-react";

export default function StudentRatings() {
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [editingRatingId, setEditingRatingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchData(parsedUser.id);
    }
  }, []);

  async function fetchData(studentId) {
    try {
      const enrollRes = await api.get("/enrollments");
      const filtered = enrollRes.data.filter((e) => e.student_id === studentId);
      setEnrollments(filtered);

      const coursesRes = await api.get("/courses");
      setCourses(coursesRes.data);

      const ratingsRes = await api.get("/ratings");
      const myRatingsFiltered = ratingsRes.data.filter((r) => r.student_id === studentId);
      setMyRatings(myRatingsFiltered);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRatingSubmit(e) {
    e.preventDefault();
    
    if (!selectedCourse || !lecturerId || !rating) {
      setMessage("❌ Please fill in all required fields.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.post("/ratings", {
        student_id: user.id,
        lecturer_id: lecturerId,
        course_id: selectedCourse,
        rating,
        comment,
      });
      setMessage("✅ Rating submitted successfully!");
      setSelectedCourse("");
      setLecturerId("");
      setRating(0);
      setComment("");
      fetchData(user.id);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to submit rating.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleDeleteRating(ratingId) {
    if (!window.confirm("Are you sure you want to delete this rating?")) {
      return;
    }

    try {
      await api.delete(`/ratings/${ratingId}`);
      setMessage("✅ Rating deleted successfully!");
      fetchData(user.id);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete rating.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function handleEditRating(rating) {
    setEditingRatingId(rating.id);
    setEditRating(rating.rating);
    setEditComment(rating.comment || "");
  }

  function cancelEdit() {
    setEditingRatingId(null);
    setEditRating(0);
    setEditComment("");
  }

  async function handleUpdateRating(ratingId) {
    if (!editRating) {
      setMessage("❌ Please select a rating.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.put(`/ratings/${ratingId}`, {
        rating: editRating,
        comment: editComment,
      });
      setMessage("✅ Rating updated successfully!");
      setEditingRatingId(null);
      setEditRating(0);
      setEditComment("");
      fetchData(user.id);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update rating.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Dashboard user={user}>
      <div className="student-dashboard">
        {/* Page Header with Blue Gradient */}
        <div className="dashboard-hero mb-4" style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '1rem'
        }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-3">
                <div className="hero-icon bg-white bg-opacity-20 p-3 rounded-3">
                  <Star size={48} color="white" />
                </div>
                <div>
                  <h1 className="hero-title mb-1 text-white">Rate Lecturers</h1>
                  <p className="hero-subtitle mb-0 text-white-80">
                    Share your feedback and help improve teaching quality
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="d-flex align-items-center justify-content-end gap-2 text-white-80">
                <CheckCircle size={20} color="white" />
                <span>{enrollments.length - myRatings.length} courses pending rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Simplified */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <Star size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{myRatings.length}</div>
                <div className="stat-label">Ratings Given</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card stat-card-green">
              <div className="stat-icon">
                <CheckCircle size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{myRatings.filter(r => r.rating === 5).length}</div>
                <div className="stat-label">5-Star Ratings</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card stat-card-orange">
              <div className="stat-icon">
                <MessageSquare size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {myRatings.filter(r => r.comment && r.comment.trim() !== '').length}
                </div>
                <div className="stat-label">With Comments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show mb-4`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Submit Rating Card - Full Width */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="modern-card">
              <div className="card-header-modern">
                <div className="d-flex align-items-center gap-2">
                  <Star size={24} className="text-warning" />
                  <h3 className="card-title-modern mb-0">Submit New Rating</h3>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Select Course *</label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="form-select form-select-lg"
                        required
                      >
                        <option value="">Choose a course...</option>
                        {enrollments.map((e) => {
                          const course = courses.find((c) => c.id === e.course_id);
                          return (
                            <option key={course?.id} value={course?.id}>
                              {course?.course_code} - {course?.course_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Lecturer ID *</label>
                      <input
                        type="text"
                        value={lecturerId}
                        onChange={(e) => setLecturerId(e.target.value)}
                        placeholder="Enter lecturer ID"
                        className="form-control form-control-lg"
                        required
                      />
                      <small className="text-muted mt-1 d-block">Ask your lecturer for their ID if you don't know it</small>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Your Rating *</label>
                      <div className="text-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`btn btn-link p-1 ${rating >= star ? 'text-warning' : 'text-muted'}`}
                            onClick={() => setRating(star)}
                            style={{ border: 'none', background: 'none' }}
                          >
                            <Star
                              size={32}
                              fill={rating >= star ? "currentColor" : "none"}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="text-center mt-2">
                        <span className="fw-bold text-dark">
                          {rating === 0 && "Select a rating"}
                          {rating === 1 && "⭐ Poor"}
                          {rating === 2 && "⭐⭐ Fair"}
                          {rating === 3 && "⭐⭐⭐ Good"}
                          {rating === 4 && "⭐⭐⭐⭐ Very Good"}
                          {rating === 5 && "⭐⭐⭐⭐⭐ Excellent"}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Comment (Optional)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="form-control form-control-lg"
                        placeholder="Share your thoughts about the lecturer's teaching style, communication, and effectiveness..."
                        rows="3"
                      ></textarea>
                      <small className="text-muted mt-1 d-block">Be constructive and specific in your feedback</small>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <button 
                      onClick={handleRatingSubmit}
                      className="btn btn-primary w-100 btn-lg py-3 mt-3"
                      disabled={!selectedCourse || !lecturerId || !rating}
                    >
                      <Send size={20} className="me-2" />
                      Submit Rating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Guidelines Card - Full Width */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="modern-card">
              <div className="card-header-modern">
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={24} className="text-info" />
                  <h3 className="card-title-modern mb-0">Rating Guidelines</h3>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-4">
                      <h6 className="fw-bold text-dark mb-3">
                        💡 Tips for Quality Feedback
                      </h6>
                      <ul className="text-muted">
                        <li>Be honest and constructive in your feedback</li>
                        <li>Focus on teaching quality and effectiveness</li>
                        <li>Mention specific examples when possible</li>
                        <li>Consider communication and availability</li>
                        <li>Think about course organization and structure</li>
                        <li>Evaluate fairness in grading and assessments</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-4 bg-light rounded-3 border-start border-4 border-primary">
                      <h6 className="fw-bold text-dark mb-2">
                        🔒 Your Privacy Matters
                      </h6>
                      <p className="text-muted mb-0">
                        Your ratings are confidential and help improve teaching quality. 
                        Always be respectful and constructive in your feedback.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-warning bg-opacity-10 rounded-3 border-start border-4 border-warning mt-3">
                      <h6 className="fw-bold text-dark mb-2">
                        ⭐ Rating Scale
                      </h6>
                      <p className="text-muted mb-0">
                        1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ratings Card - Full Width */}
        <div className="row">
          <div className="col-12">
            <div className="modern-card">
              <div className="card-header-modern">
                <div className="d-flex align-items-center gap-2">
                  <MessageSquare size={24} className="text-success" />
                  <h3 className="card-title-modern mb-0">My Recent Ratings</h3>
                </div>
                <span className="badge bg-success-subtle text-success">
                  {myRatings.length} total
                </span>
              </div>
              <div className="card-body">
                {myRatings.length > 0 ? (
                  <div className="row g-4">
                    {myRatings.slice(0, 6).map((r) => {
                      const course = courses.find(c => c.id === r.course_id);
                      return (
                        <div key={r.id} className="col-md-6 col-lg-4">
                          <div className="rating-card h-100 position-relative">
                            {/* Action Buttons */}
                            <div className="rating-actions position-absolute top-0 end-0 p-2">
                              {editingRatingId === r.id ? (
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleUpdateRating(r.id)}
                                    title="Save changes"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={cancelEdit}
                                    title="Cancel editing"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleEditRating(r)}
                                    title="Edit rating"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleDeleteRating(r.id)}
                                    title="Delete rating"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className="text-success fw-semibold">
                                {course?.course_code}
                              </span>
                              {editingRatingId === r.id ? (
                                <div className="d-flex align-items-center gap-2">
                                  <div className="d-flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        className={`btn btn-link p-0 ${editRating >= star ? 'text-warning' : 'text-muted'}`}
                                        onClick={() => setEditRating(star)}
                                        style={{ border: 'none', background: 'none' }}
                                      >
                                        <Star
                                          size={16}
                                          fill={editRating >= star ? "currentColor" : "none"}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                  <span className="fw-bold">{editRating}/5</span>
                                </div>
                              ) : (
                                <div className="d-flex align-items-center gap-2">
                                  <div className="d-flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={16}
                                        className={i < r.rating ? "text-warning" : "text-muted"}
                                        fill={i < r.rating ? "currentColor" : "none"}
                                      />
                                    ))}
                                  </div>
                                  <span className="fw-bold">{r.rating}/5</span>
                                </div>
                              )}
                            </div>
                            
                            <h6 className="fw-semibold mb-2">
                              {course?.course_name}
                            </h6>
                            
                            {editingRatingId === r.id ? (
                              <div className="mb-2">
                                <textarea
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  className="form-control form-control-sm"
                                  placeholder="Update your comment..."
                                  rows="2"
                                ></textarea>
                              </div>
                            ) : (
                              <p className="rating-comment mb-2">"{r.comment || 'No comment provided'}"</p>
                            )}
                            
                            <div className="text-muted small">
                              Lecturer ID: {r.lecturer_id}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <Star size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No ratings submitted yet</h5>
                    <p className="text-muted">
                      Start by submitting your first rating above
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
}