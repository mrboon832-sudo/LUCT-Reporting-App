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

export async function updateEnrollment(req, res) {
  const { id } = req.params;
  const { student_id, course_id } = req.body;
  
  try {
    const result = await pool.query(
      "UPDATE enrollments SET student_id = $1, course_id = $2 WHERE id = $3 RETURNING *",
      [student_id, course_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    
    res.json({ 
      message: "Enrollment updated successfully",
      enrollment: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteEnrollment(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "DELETE FROM enrollments WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    
    res.json({ 
      message: "Enrollment deleted successfully",
      deletedEnrollment: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}