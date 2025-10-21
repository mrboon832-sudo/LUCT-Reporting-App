import { pool } from "../db.js"

export async function getStreams(req, res) {
  try {
    console.log("📥 GET /streams - Fetching all streams");
    const result = await pool.query("SELECT * FROM streams ORDER BY id ASC")
    console.log(`✅ Found ${result.rows.length} streams`);
    res.json(result.rows)
  } catch (err) {
    console.error("❌ Error fetching streams:", err);
    res.status(500).json({ error: err.message })
  }
}

export async function addStream(req, res) {
  console.log("📥 POST /streams - Request body:", req.body);
  
  const { id, stream_name, prl_id } = req.body

  // Validation
  if (!id || !stream_name) {
    console.log("❌ Validation failed: Missing required fields");
    return res.status(400).json({ 
      error: "Missing required fields",
      details: "id and stream_name are required"
    });
  }

  try {
    console.log("💾 Inserting stream into database...");
    console.log("Values:", { id, stream_name, prl_id: prl_id || null });

    const result = await pool.query(
      "INSERT INTO streams (id, stream_name, prl_id) VALUES ($1, $2, $3) RETURNING *",
      [id, stream_name, prl_id || null]
    )

    console.log("✅ Stream created successfully:", result.rows[0]);
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error("❌ Error adding stream:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);

    // Handle duplicate key error
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: "Duplicate stream ID",
        details: "A stream with this ID already exists"
      });
    }

    // Handle foreign key error
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: "Invalid PRL ID",
        details: "The specified PRL does not exist"
      });
    }

    res.status(500).json({ 
      error: err.message,
      code: err.code,
      details: "Failed to create stream"
    })
  }
}

export async function updateStream(req, res) {
  const { id } = req.params;
  const { stream_name, prl_id } = req.body;

  console.log(`📥 PUT /streams/${id} - Request body:`, req.body);

  try {
    const result = await pool.query(
      "UPDATE streams SET stream_name = $1, prl_id = $2 WHERE id = $3 RETURNING *",
      [stream_name, prl_id, id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Stream with ID ${id} not found`);
      return res.status(404).json({ error: "Stream not found" });
    }

    console.log("✅ Stream updated successfully:", result.rows[0]);
    res.json({ 
      message: "Stream updated successfully",
      stream: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error updating stream:", err);
    
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: "Invalid PRL ID",
        details: "The specified PRL does not exist"
      });
    }

    res.status(500).json({ error: err.message });
  }
}

export async function deleteStream(req, res) {
  const { id } = req.params;
  console.log(`📥 DELETE /streams/${id} - Deleting stream`);

  try {
    const result = await pool.query(
      "DELETE FROM streams WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Stream with ID ${id} not found`);
      return res.status(404).json({ error: "Stream not found" });
    }

    console.log("✅ Stream deleted successfully:", result.rows[0]);
    res.json({ 
      message: "Stream deleted successfully",
      deletedStream: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error deleting stream:", err);
    res.status(500).json({ error: err.message });
  }
}