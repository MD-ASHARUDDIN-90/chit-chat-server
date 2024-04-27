import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAllMessages } from "../controllers/messageController.js";

const router = express.Router();

//add auth middleware and controller function
router.get("/", authMiddleware, getAllMessages);

export default router;
