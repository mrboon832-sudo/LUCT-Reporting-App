import express from "express"
import { getFeedback, addFeedback } from "../controllers/feedbackController.js"

let router = express.Router()

router.get("/", getFeedback)
router.post("/", addFeedback)

export default router
