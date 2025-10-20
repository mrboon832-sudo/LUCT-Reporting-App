import express from "express"
import { getReports, addReport } from "../controllers/lectureReportsController.js"

let router = express.Router()

router.get("/", getReports)
router.post("/", addReport)

export default router
