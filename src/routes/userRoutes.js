import express from "express";
import {
	getMyPosts,
	getUserData,
	updateUserData,
	updateUserPassword,
} from "../controllers/userController.js";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/", getUserData);
router.get("/posts", getMyPosts);
router.put("/update", uploadMiddleware, updateUserData);
router.put("/update-password", updateUserPassword);

export default router;
