import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Users from "../models/userModel.js";
import { uploadToCloudinary } from "../utility/cloudinary.js";

async function login(req, res) {
	const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ message: "Username and password are required" });
	}

	try {
		const user = await Users.findOne({ username });

		if (!user) {
			return res.status(401).json({ message: "Invalid username or password" });
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ message: "Invalid username or password" });
		}
		const token = jwt.sign({ username: user.username }, JWT_SECRET_KEY, {
			expiresIn: "1h",
		});
		res.json({
			username: user.username,
			email: user.email,
			createdAt: user.createdAt,
			token,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
}

async function signup(req, res) {
	try {
		const { username, email, password } = req.body;
		// console.log("file-->", req.file);
		// console.log("body-->>", JSON.parse(JSON.stringify(req.body)));
		if (!username || !email || !password) {
			return res
				.status(400)
				.json({ message: "Username, email, and password are required" });
		}

		// Extract the path of the uploaded file.
		const avatarLocalPath = req.file?.path;
		// If the file is not found, throw an error.
		if (!avatarLocalPath) {
			return res.status(400).json({ message: "Profile picture is required" });
		}

		const url = await uploadToCloudinary(avatarLocalPath);

		const existingUser = await Users.findOne({
			$or: [{ username }, { email }],
		});
		if (existingUser) {
			return res
				.status(409)
				.json({ message: "Username or email already exists" });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new Users({
			username,
			email,
			password: hashedPassword,
			profilePicture: url,
		});

		//OTP 4 digit create
		// newUser.otp = Math.floor(1000 + Math.random() * 9000);
		//expiry otp
		// newUser.otp_expiry = Date.now() + 300000; // 5 minutes

		//sendEmail
		//template backtick OTP send email

		await newUser.save();
		res.status(201).json({ message: "User created successfully" });
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
}

export { login, signup };
