import express from "express";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";
const router = express.Router();
import {
	login,
	logout,
	signup,
	verifyOtp,
	findMyAccount,
	resetPassword,
} from "../controllers/authController.js";
router.post("/login", login);
router.post("/logout", logout);
router.post("/signup", uploadMiddleware, signup);
router.post("/verify-otp", verifyOtp);
router.post("/find-account", findMyAccount);
router.post("/reset-password", resetPassword);

export default router;
