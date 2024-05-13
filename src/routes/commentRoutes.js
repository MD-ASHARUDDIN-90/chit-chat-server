import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
import { createComment } from "../controllers/commentController.js";

const router = express.Router();

router.post("/create", uploadMiddleware, createComment);

export default router;
