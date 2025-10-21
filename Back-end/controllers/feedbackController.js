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

export async function updateFeedback(req, res) {
  const { id } = req.params;
  const { report_id, prl_id, feedback_text } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE feedback 
       SET report_id = $1, prl_id = $2, feedback_text = $3 
       WHERE id = $4 RETURNING *`,
      [report_id, prl_id, feedback_text, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    
    res.json({ 
      message: "Feedback updated successfully",
      feedback: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteFeedback(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "DELETE FROM feedback WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    
    res.json({ 
      message: "Feedback deleted successfully",
      deletedFeedback: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}