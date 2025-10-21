import express from "express"
import { getRatings, addRating, updateRating, deleteRating } from "../controllers/ratingsController.js"

let router = express.Router()

router.get("/", getRatings)
router.post("/", addRating)
router.put("/:id", updateRating)
router.delete("/:id", deleteRating)

export default router