import { pool } from "../db.js";

export const getCourses = async (req, res) => {
  try {
    console.log("📥 GET /courses - Fetching all courses");
    const result = await pool.query("SELECT * FROM courses ORDER BY id DESC");
    console.log(`✅ Found ${result.rows.length} courses`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    console.error("Error details:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: err.message,
      details: "Failed to fetch courses from database"
    });
  }
};

export const addCourse = async (req, res) => {
  console.log("📥 POST /courses - Request body:", req.body);
  
  const { 
    course_code, 
    course_name, 
    faculty_name, 
    stream_id, 
    total_registered_students, 
    status 
  } = req.body;

  // Validation
  if (!course_code || !course_name || !faculty_name || !stream_id) {
    console.log("❌ Validation failed: Missing required fields");
    return res.status(400).json({ 
      error: "Missing required fields",
      details: "course_code, course_name, faculty_name, and stream_id are required"
    });
  }

  try {
    console.log("💾 Inserting course into database...");
    console.log("Values:", {
      course_code,
      course_name,
      faculty_name,
      stream_id,
      total_registered_students: total_registered_students || 0,
      status: status || 'active'
    });

    const result = await pool.query(
      `INSERT INTO courses 
       (course_code, course_name, faculty_name, stream_id, total_registered_students, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        course_code, 
        course_name, 
        faculty_name, 
        stream_id, 
        total_registered_students || 0, 
        status || 'active'
      ]
    );

    console.log("✅ Course added successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding course:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Error detail:", err.detail);
    console.error("Stack trace:", err.stack);

    // Handle specific PostgreSQL errors
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: "Duplicate course code",
        details: "A course with this code already exists"
      });
    }

    if (err.code === '23503') {
      return res.status(400).json({ 
        error: "Invalid foreign key",
        details: "The stream_id does not exist"
      });
    }

    res.status(500).json({ 
      error: err.message,
      code: err.code,
      details: "Failed to add course to database"
    });
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { 
    course_code, 
    course_name, 
    faculty_name, 
    stream_id, 
    total_registered_students, 
    status 
  } = req.body;

  console.log(`📥 PUT /courses/${id} - Request body:`, req.body);

  try {
    const result = await pool.query(
      `UPDATE courses 
       SET course_code = $1, course_name = $2, faculty_name = $3, 
           stream_id = $4, total_registered_students = $5, status = $6
       WHERE id = $7 RETURNING *`,
      [
        course_code, 
        course_name, 
        faculty_name, 
        stream_id, 
        total_registered_students, 
        status, 
        id
      ]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Course with ID ${id} not found`);
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("✅ Course updated successfully:", result.rows[0]);
    res.json({ 
      message: "Course updated successfully",
      course: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error updating course:", err);
    
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: "Duplicate course code",
        details: "A course with this code already exists"
      });
    }

    if (err.code === '23503') {
      return res.status(400).json({ 
        error: "Invalid foreign key",
        details: "The stream_id does not exist"
      });
    }

    res.status(500).json({ error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  console.log(`📥 DELETE /courses/${id} - Deleting course`);

  try {
    const result = await pool.query(
      "DELETE FROM courses WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Course with ID ${id} not found`);
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("✅ Course deleted successfully:", result.rows[0]);
    res.json({ 
      message: "Course deleted successfully",
      deletedCourse: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error deleting course:", err);
    res.status(500).json({ error: err.message });
  }
};