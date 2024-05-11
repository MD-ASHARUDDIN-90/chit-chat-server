import Users from "../models/userModel.js";
import { uploadToCloudinary } from "../utility/cloudinary.js";

async function getUserData(req, res) {
	try {
		const { id } = req.user;
		const user = await Users.findById(id).select("-password -otp -otp_expiry");
		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function updateUserData(req, res) {
	try {
		console.log(req.body);
		const { id } = req.user;
		const avatarLocalPath = req.file?.path;
		console.log("avatarLocalPath", avatarLocalPath);

		if (avatarLocalPath) {
			const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
			const { url, public_id } = cloudinaryResponse;
			console.log("url", url);
			req.body.profilePicture = url;
		}

		const user = await Users.findByIdAndUpdate(id, req.body, {
			new: true,
		}).select("-password -otp -otp_expiry");
		console.log("user", user);
		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}
export { getUserData, updateUserData };
