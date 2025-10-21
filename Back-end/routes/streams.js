import express from "express"
import { getStreams, addStream, updateStream, deleteStream } from "../controllers/streamsController.js"

let router = express.Router()

router.get("/", getStreams)
router.post("/", addStream)
router.put("/:id", updateStream)
router.delete("/:id", deleteStream)

export default router