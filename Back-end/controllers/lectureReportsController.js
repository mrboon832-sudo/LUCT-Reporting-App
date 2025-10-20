import { pool } from "../db.js"

export async function getReports(req, res) {
  try {
    let result = await pool.query("SELECT * FROM lecture_reports ORDER BY id DESC")
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addReport(req, res) {
  let { lecturer_id, course_id, class_name, week_of_reporting, date_of_lecture, actual_students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations } = req.body
  try {
    let result = await pool.query(
      `INSERT INTO lecture_reports (lecturer_id, course_id, class_name, week_of_reporting, date_of_lecture, actual_students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [lecturer_id, course_id, class_name, week_of_reporting, date_of_lecture, actual_students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
