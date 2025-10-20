import { pool } from "../db.js"

export async function getRatings(req, res) {
  try {
    let result = await pool.query("SELECT * FROM ratings ORDER BY id DESC")
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addRating(req, res) {
  let { student_id, lecturer_id, course_id, rating, comment } = req.body
  try {
    let result = await pool.query(
      `INSERT INTO ratings (student_id, lecturer_id, course_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [student_id, lecturer_id, course_id, rating, comment]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
