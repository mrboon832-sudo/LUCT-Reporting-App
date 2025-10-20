import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

import userRoutes from "./routes/users.js";
import courseRoutes from "./routes/courses.js";
import reportRoutes from "./routes/lectureReports.js";
import feedbackRoutes from "./routes/feedback.js";
import ratingRoutes from "./routes/ratings.js";
import assignmentRoutes from "./routes/courseAssignments.js";
import streamRoutes from "./routes/streams.js";
import enrollmentRoutes from "./routes/enrollments.js";

dotenv.config();

const app = express();


app.use(cors({ origin: "https://luct-reporting-app-1-jmrb.onrender.com" }));


app.use(express.json());


pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.stack);
  });


app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/enrollments", enrollmentRoutes);

app.get("/", (req, res) => {
  res.send("LUCT Reporting API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
