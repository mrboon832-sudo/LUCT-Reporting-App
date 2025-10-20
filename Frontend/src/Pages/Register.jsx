import { useState } from "react"
import api from '../Api/api';
import "../CSS/Auth.css"
import logo from "../Pages/Limkokwing_Lesotho_Logo.jpg";
import { useNavigate, Link } from "react-router-dom"

export default function Register() {
  const [full_name, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [staff_student_id, setStaffId] = useState("")
  const [role, setRole] = useState("student")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      let res = await api.post("/users/register", {
        full_name,
        email,
        password,
        staff_student_id,
        role,
      })
      setMessage("✅ Registered successfully! You can now log in.")
      setTimeout(() => navigate("/login"), 1500)
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.error || "Registration failed."))
    }
  }

    return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="header-background">
          <div className="header-overlay">
            <img 
              src={logo} 
              alt="Limkokwing Lesotho Logo" 
              className="header-logo"
            />
            <h1 className="app-name">Limkokwing Student Portal</h1>
            <p className="app-tagline">Shape Your Future With Us</p>
          </div>
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          <div className="card-header">
            <h2>Create Account</h2>
            <p>Join our learning community</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Staff/Student ID"
                value={staff_student_id}
                onChange={(e) => setStaffId(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="prl">PRL</option>
                <option value="pl">PL</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" className="auth-btn">
              Register
            </button>

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <p className="auth-link">
              Already have an account?{" "}
              <Link to="/login" className="link">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}