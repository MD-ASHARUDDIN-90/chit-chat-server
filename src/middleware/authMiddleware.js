import jwt from "jsonwebtoken";

//create a auth middleware

export const authMiddleware = async (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];
	//verify token
	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Unauthorized" });
	}
};
