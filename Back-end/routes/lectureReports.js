import express from "express"
import { getReports, addReport, updateReport, deleteReport } from "../controllers/lectureReportsController.js"

let router = express.Router()

router.get("/", getReports)
router.post("/", addReport)
router.put("/:id", updateReport)
router.delete("/:id", deleteReport)

export default router