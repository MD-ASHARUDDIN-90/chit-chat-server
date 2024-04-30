import jwt from "jsonwebtoken";
import UserToken from "../models/userTokenModel.js";

const verifyRefreshToken = async (refreshToken) => {
	const privateKey = process.env.REFRESH_TOKEN_SECRET_KEY;
	const doc = await UserToken.findOne({ token: refreshToken });

	if (!doc) {
		return {
			error: true,
			message: "Invalid refresh token",
			tokenDetails: null,
		};
	}

	// Check if the refresh token has expired
	if (doc.expiresAt < new Date()) {
		return {
			error: true,
			message: "Refresh token expired",
			tokenDetails: null,
		};
	}

	const tokenDetails = jwt.verify(refreshToken, privateKey);

	return { tokenDetails, error: false, message: "Valid refresh token" };
};

export default verifyRefreshToken;
