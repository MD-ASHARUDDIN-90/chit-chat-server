import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
const router = express.Router();
import {
	login,
	logout,
	signup,
	varifyOtp,
} from "../controllers/authController.js";
router.post("/login", login);
router.post("/logout", logout);
router.post("/signup", uploadMiddleware, signup);
router.post("/varify-otp", varifyOtp);

export default router;
