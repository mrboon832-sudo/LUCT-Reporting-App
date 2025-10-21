import express from "express"
import { getEnrollments, addEnrollment, updateEnrollment, deleteEnrollment } from "../controllers/enrollmentsController.js"

let router = express.Router()

router.get("/", getEnrollments)
router.post("/", addEnrollment)
router.put("/:id", updateEnrollment)
router.delete("/:id", deleteEnrollment)

export default router