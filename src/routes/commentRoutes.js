import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
import {
	createComment,
	getAllCommentsByPost,
} from "../controllers/commentController.js";

const router = express.Router();

router.get("/", uploadMiddleware, getAllCommentsByPost);
router.post("/create", uploadMiddleware, createComment);

export default router;
