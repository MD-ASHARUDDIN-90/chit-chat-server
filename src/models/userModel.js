import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: true,
	},
	profilePicture: {
		type: String,
		default:
			"https://res.cloudinary.com/dmgyhxdck/image/upload/v1714072221/chit-chat/foszghw3jpppl1sw2rb4.png",
	},
	displayPicture: {
		type: String,
		default: "",
	},
	country: {
		type: String || null,
	},
	city: {
		type: String || null,
	},
	about: {
		type: String || null,
	},
	otp: {
		type: Number || null,
	},
	otp_expiry: {
		type: Date || null,
	},
	verified: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export default mongoose.model("User", userSchema);
