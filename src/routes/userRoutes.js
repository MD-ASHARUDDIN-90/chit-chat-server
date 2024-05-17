import express from "express";
import {
	getMyPosts,
	getUserData,
	updateDisplayPicture,
	updateUserData,
	updateUserPassword,
} from "../controllers/userController.js";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/", getUserData);
router.get("/posts", getMyPosts);
router.put("/update", uploadMiddleware, updateUserData);
router.put("/update/display-picture", uploadMiddleware, updateDisplayPicture);
router.put("/update-password", updateUserPassword);

export default router;
