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

export async function updateRating(req, res) {
  const { id } = req.params;
  const { rating, comment } = req.body;
  
  // Validate rating
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  
  try {
    const result = await pool.query(
      `UPDATE ratings 
       SET rating = $1, comment = $2 
       WHERE id = $3 RETURNING *`,
      [rating, comment, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rating not found" });
    }
    
    res.json({ 
      message: "Rating updated successfully",
      rating: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteRating(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "DELETE FROM ratings WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rating not found" });
    }
    
    res.json({ 
      message: "Rating deleted successfully",
      deletedRating: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}