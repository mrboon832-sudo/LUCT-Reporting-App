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

export async function updateAssignment(req, res) {
  const { id } = req.params;
  const { course_id, lecturer_id, assigned_by } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE course_assignments 
       SET course_id = $1, lecturer_id = $2, assigned_by = $3 
       WHERE id = $4 RETURNING *`,
      [course_id, lecturer_id, assigned_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    res.json({ 
      message: "Assignment updated successfully",
      assignment: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteAssignment(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "DELETE FROM course_assignments WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    res.json({ 
      message: "Assignment deleted successfully",
      deletedAssignment: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}