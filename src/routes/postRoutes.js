import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
import {
	createPost,
	getAllPosts,
	getPostById,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.post("/create", uploadMiddleware, createPost);

export default router;
