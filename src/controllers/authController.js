import Users from "../models/userModel.js";
import UserToken from "../models/userTokenModel.js";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../utility/cloudinary.js";
import {
	generateRefreshToken,
	generateToken,
} from "../utility/generateToken.js";
import {
	comparePassword,
	createHashedPassword,
} from "../utility/hashedPassword.js";
import verifyRefreshToken from "../utility/verifyRefreshToken.js";
import { getEmailTemplate } from "../const/emailTemplate.js";
import { sendEmail } from "../utility/sendEmail.js";
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

		const userData = user.toJSON();
		delete userData.password;

		res.status(200).json({
			...userData,
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
		console.log(req.file);
		console.log(username, email, password);
		if (!username || !email || !password) {
			return res
				.status(400)
				.json({ message: "Username, email, and password are required" });
		}

		const avatarLocalPath = req.file?.path;
		if (!avatarLocalPath) {
			return res.status(400).json({ message: "Profile picture is required" });
		}

		const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
		const { url, public_id } = cloudinaryResponse;

		const existingUser = await Users.findOne({
			$or: [{ username }, { email }],
		});
		if (existingUser) {
			await deleteFromCloudinary(public_id);
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
			otp: Math.floor(1000 + Math.random() * 9000),
			otp_expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
		});

		try {
			const { subject, text, html } = getEmailTemplate(
				newUser.username,
				newUser.otp,
			);
			await sendEmail(newUser.email, subject, text, html);
			const savedUser = await newUser.save();
			res
				.status(201)
				.json({ message: "User created successfully", data: savedUser });
		} catch (err) {
			console.error(err);
			await deleteFromCloudinary(public_id);
			res.status(500).send("Error sending email");
		}
	} catch (error) {
		console.error("Signup error:", error);
		await deleteFromCloudinary(public_id);
		res.status(500).json({ message: "Internal server error" });
	}
}
const verifyOtp = async ({ body: { otp, _id } }, res) => {
	console.log(otp, _id);
	if (!otp) return res.status(400).json({ message: "Otp is required" });

	const userData = await Users.findById(_id);
	console.log("userData", userData);
	if (!userData || userData.otp != otp) {
		return res.status(401).json({ message: "Wrong Otp" });
	}

	if (userData.otp_expiry < Date.now()) {
		await Users.findByIdAndDelete(_id);
		const parts = profilePicture.split("/");
		const public_id =
			parts[parts.length - 2] + "/" + parts[parts.length - 1].split(".")[0];
		await deleteFromCloudinary(public_id);
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

export { login, signup, verifyOtp, logout };
