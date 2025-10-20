import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// GET all users
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REGISTER user
export const registerUser = async (req, res) => {
  const { full_name, email, password, staff_student_id, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password, staff_student_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [full_name, email, hashed, staff_student_id, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      "secretkey",
      { expiresIn: "2h" }
    );

    res.json({ token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
