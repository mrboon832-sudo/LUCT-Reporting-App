import express from "express"
import { getEnrollments, addEnrollment } from "../controllers/enrollmentsController.js"

let router = express.Router()

router.get("/", getEnrollments)
router.post("/", addEnrollment)

export default router
