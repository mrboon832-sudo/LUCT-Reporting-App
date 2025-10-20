import { useState } from "react"
import api from '../Api/api'; 
import "../CSS/Auth.css"
import logo from "../Pages/Limkokwing_Lesotho_Logo.jpg";
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  let [email, setEmail] = useState("")
  let [password, setPassword] = useState("")
  let [message, setMessage] = useState("")
  let navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      let res = await api.post("/users/login", { email, password })
      let { token, user } = res.data

      // store token and user info
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))

      setMessage("✅ Login successful!")

      // redirect by role
      setTimeout(() => {
        if (user.role === "student") navigate("/student")
        else if (user.role === "lecturer") navigate("/lecturer")
        else if (user.role === "prl") navigate("/prl")
        else if (user.role === "pl") navigate("/pl")
        else if (user.role === "admin") navigate("/admin")
      }, 1000)
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Invalid login."))
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
            <h2>Welcome Back!</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="auth-btn">
              Login
            </button>

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <p className="auth-link">
              Don't have an account?{" "}
              <Link to="/register" className="link">Register here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
