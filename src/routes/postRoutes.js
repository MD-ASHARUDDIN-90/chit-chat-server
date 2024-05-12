import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
import { createPost } from "../controllers/postController.js";

const router = express.Router();

router.post("/create", uploadMiddleware, createPost);

export default router;
