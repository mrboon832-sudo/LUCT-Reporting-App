import express from "express"
import { getStreams, addStream } from "../controllers/streamsController.js"

let router = express.Router()

router.get("/", getStreams)
router.post("/", addStream)

export default router
