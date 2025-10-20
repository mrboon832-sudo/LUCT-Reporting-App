import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export function authenticateToken(req, res, next) {
  let authHeader = req.headers["authorization"]
  let token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." })
    }
    req.user = user
    next()
  })
}

// access based on role
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Not enough privileges." })
    }
    next()
  }
}
