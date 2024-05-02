import express from "express";
import Users from "../models/userModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
	//temporary route
	try {
		const { id } = req.user;
		const user = await Users.findById(id).select("-password -otp -otp_expiry");
		console.log(user);
		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
});

export default router;
