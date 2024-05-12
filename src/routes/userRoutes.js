import express from "express";
import {
	getUserData,
	updateUserData,
	updateUserPassword,
} from "../controllers/userController.js";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/", getUserData);
router.put("/update", uploadMiddleware, updateUserData);
router.put("/update-password", updateUserPassword);

export default router;
