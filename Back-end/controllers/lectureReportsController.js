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

export async function updateReport(req, res) {
  const { id } = req.params;
  const { lecturer_id, course_id, class_name, week_of_reporting, date_of_lecture, actual_students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE lecture_reports 
       SET lecturer_id = $1, course_id = $2, class_name = $3, week_of_reporting = $4, 
           date_of_lecture = $5, actual_students_present = $6, venue = $7, 
           scheduled_time = $8, topic_taught = $9, learning_outcomes = $10, 
           recommendations = $11
       WHERE id = $12 RETURNING *`,
      [lecturer_id, course_id, class_name, week_of_reporting, date_of_lecture, actual_students_present, venue, scheduled_time, topic_taught, learning_outcomes, recommendations, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    res.json({ 
      message: "Report updated successfully",
      report: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteReport(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "DELETE FROM lecture_reports WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    res.json({ 
      message: "Report deleted successfully",
      deletedReport: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}