import express from "express";
import { getCourses, addCourse, updateCourse, deleteCourse } from "../controllers/coursesController.js";

const router = express.Router();

router.get("/", getCourses);
router.post("/", addCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;