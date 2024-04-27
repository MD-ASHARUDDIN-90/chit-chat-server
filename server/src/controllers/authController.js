import Users from "../models/userModel.js";
import UserToken from "../models/userTokenModel.js";
import { uploadToCloudinary } from "../utility/cloudinary.js";
import {
	generateRefreshToken,
	generateToken,
} from "../utility/generateToken.js";
import {
	comparePassword,
	createHashedPassword,
} from "../utility/hashedPassword.js";
import verifyRefreshToken from "../utility/verifyRefreshToken.js";
 

async function login(req, res) {
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

		if (!user.verified) {
			return res.status(401).json({ message: "Please verify your email" });
		}

		const match = await comparePassword(password, user.password);
		if (!match) {
			return res.status(401).json({ message: "Invalid username or password" });
		}

		try {
			const userToken = await UserToken.findOne({ userId: user._id });
			if (userToken) {
				// If the user already has a refresh token, delete it
				await UserToken.findByIdAndDelete(userToken._id);
			} // If the user doesn't have a refresh token, do nothing
		} catch (error) {
			// If there's an error, ignore it and move on
			console.error("Error deleting refresh token:", error);
		}

		// If the user doesn't have a refresh token, create a new one

		const accessToken = generateToken(user._id);
		const refreshToken = generateRefreshToken(user._id);
		// Save the refresh token in the database
		const newRefreshToken = new UserToken({
			userId: user._id,
			token: refreshToken,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		});

		await newRefreshToken.save();

		res.json({
			username: user.username,
			email: user.email,
			createdAt: user.createdAt,
			accessToken,
			refreshToken,
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
		const hashedPassword = await createHashedPassword(password);
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
const varifyOtp = async ({ body: { otp, _id } }, res) => {
	if (!otp) return res.status(400).json({ message: "Otp is required" });

	const userData = await Users.findById(_id);
	if (!userData || userData.otp !== otp) {
		return res.status(401).json({ message: "Wrong Otp" });
	}

	if (userData.otp_expiry < Date.now()) {
		await Users.findByIdAndDelete(_id);
		return res.status(401).json({ message: "Otp expired" });
	}

	userData.verified = true;
	userData.otp = null;
	userData.otp_expiry = null;
	await userData.save();

	res.json({ message: "Otp verified successfully" });
};


//creata a logout function also remove the refresh token from the database
const logout = async (req, res) => {
	try {
		const { refreshToken } = req.body;

		const { error } = await verifyRefreshToken(refreshToken);
		if (error) {
			return res.status(401).json({ message });
		}

		const userToken = await UserToken.findOne({ token: refreshToken });
		if (!userToken)
			return res
				.status(200)
				.json({ error: false, message: "Logged Out Sucessfully" });

		await UserToken.findByIdAndDelete(userToken._id);
		res.status(200).json({ error: false, message: "Logged Out Sucessfully" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
	//but any how delete all token from frontend wherever it is store
};

export { login, signup, varifyOtp, logout };
