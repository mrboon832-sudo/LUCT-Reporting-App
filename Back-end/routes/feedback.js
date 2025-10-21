import express from "express"
import { getFeedback, addFeedback, updateFeedback, deleteFeedback } from "../controllers/feedbackController.js"

let router = express.Router()

router.get("/", getFeedback)
router.post("/", addFeedback)
router.put("/:id", updateFeedback)
router.delete("/:id", deleteFeedback)

export default router