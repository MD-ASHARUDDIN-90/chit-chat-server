import express from "express";

import verifyRefreshToken from "../utility/verifyRefreshToken.js";
import {
	generateRefreshToken,
	generateToken,
} from "../utility/generateToken.js";
import UserToken from "../models/userTokenModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const refreshToken = req.headers.authorization?.split(" ")[1];
		if (!refreshToken) {
			return res.status(400).json({ message: "Refresh token is missing" });
		}

		const { error, message, tokenDetails } = await verifyRefreshToken(
			refreshToken,
		);

		if (error) {
			return res.status(401).json({ message });
		}
		// If valid, generate a new access token and refresh token
		const accessToken = generateToken(tokenDetails.id);
		const newRefreshToken = generateRefreshToken(tokenDetails.id);

		// overwrite the refresh token in the database
		const doc = await UserToken.findOne({ token: refreshToken });
		doc.token = newRefreshToken;
		doc.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		await doc.save();
		res.json({ accessToken, refreshToken: newRefreshToken });
	} catch (error) {
		console.error("Refresh token error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

export default router;
