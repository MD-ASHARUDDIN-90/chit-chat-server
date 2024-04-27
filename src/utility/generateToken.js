//generate access token and refresh token helper function
import jwt from "jsonwebtoken";

export const generateToken = (id) => {
	return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET_KEY, {
		expiresIn: "1h",
	});
};

export const generateRefreshToken = (id) => {
	return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET_KEY, {
		expiresIn: "7d",
	});
};
