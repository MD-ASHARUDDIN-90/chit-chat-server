import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
import { createPost, getAllPosts } from "../controllers/postController.js";

const router = express.Router();

router.get("/", getAllPosts);
router.post("/create", uploadMiddleware, createPost);

export default router;
