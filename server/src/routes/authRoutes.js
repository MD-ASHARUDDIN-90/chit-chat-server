import express from "express";
const router = express.Router();
import { login, signup } from "../controllers/authController.js";
router.post("/login", async (req, res) => {
	try {
		await login(req, res);
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});
router.post("/signup", async (req, res) => {
	try {
		await signup(req, res);
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

export default router;
