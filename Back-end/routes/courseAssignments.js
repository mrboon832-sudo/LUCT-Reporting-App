import express from "express"
import { getAssignments, assignCourse, updateAssignment, deleteAssignment } from "../controllers/courseAssignmentsController.js"

let router = express.Router()

router.get("/", getAssignments)
router.post("/", assignCourse)
router.put("/:id", updateAssignment)
router.delete("/:id", deleteAssignment)

export default router