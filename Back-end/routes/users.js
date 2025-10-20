import express from "express";
import { getUsers, registerUser, loginUser } from "../controllers/usersController.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
