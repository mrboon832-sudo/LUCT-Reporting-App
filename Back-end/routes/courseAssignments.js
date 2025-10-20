import express from "express"
import { getAssignments, assignCourse } from "../controllers/courseAssignmentsController.js"

let router = express.Router()

router.get("/", getAssignments)
router.post("/", assignCourse)

export default router
