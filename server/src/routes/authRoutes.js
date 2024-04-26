import express from "express";
import { upload } from "../middleware/multerMiddleware.js";
const router = express.Router();
import { login, logout, signup } from "../controllers/authController.js";
router.post("/login", login);
router.post("/logout", logout);
router.post("/signup", upload.single("avatar"), signup);

export default router;
