import { pool } from "../db.js"

export async function getFeedback(req, res) {
  try {
    let result = await pool.query("SELECT * FROM feedback ORDER BY id DESC")
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addFeedback(req, res) {
  let { report_id, prl_id, feedback_text } = req.body
  try {
    let result = await pool.query(
      `INSERT INTO feedback (report_id, prl_id, feedback_text)
       VALUES ($1, $2, $3) RETURNING *`,
      [report_id, prl_id, feedback_text]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
