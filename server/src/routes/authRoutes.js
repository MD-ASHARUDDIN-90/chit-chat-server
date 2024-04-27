import express from "express";
import { upload } from "../middleware/multerMiddleware.js";
const router = express.Router();
import { login, logout, signup, varifyOtp } from "../controllers/authController.js";
router.post("/login", login);
router.post("/logout", logout);
router.post("/signup", upload.single("avatar"), signup);
router.post("/varify-otp",varifyOtp);

export default router;
