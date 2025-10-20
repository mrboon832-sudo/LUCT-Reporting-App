import express from "express"
import { getRatings, addRating } from "../controllers/ratingsController.js"

let router = express.Router()

router.get("/", getRatings)
router.post("/", addRating)

export default router
