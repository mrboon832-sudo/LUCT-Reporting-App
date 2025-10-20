import { pool } from "../db.js"

export async function getAssignments(req, res) {
  try {
    let result = await pool.query("SELECT * FROM course_assignments")
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function assignCourse(req, res) {
  let { course_id, lecturer_id, assigned_by } = req.body
  try {
    let result = await pool.query(
      `INSERT INTO course_assignments (course_id, lecturer_id, assigned_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [course_id, lecturer_id, assigned_by]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
