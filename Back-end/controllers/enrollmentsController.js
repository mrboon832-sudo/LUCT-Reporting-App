import { pool } from "../db.js"

export async function getEnrollments(req, res) {
  try {
    let result = await pool.query("SELECT * FROM enrollments ORDER BY id DESC")
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addEnrollment(req, res) {
  let { student_id, course_id } = req.body
  try {
    let result = await pool.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING *",
      [student_id, course_id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
