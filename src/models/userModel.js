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
	socketId: {
		type: String || null,
		default: null,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	// New fields for following, followers, and friend requests
	following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	friendRequestsReceived: [
		{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
	],
	friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	removedSuggestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Create a text index on the title, description, and tags fields for full-text search
userSchema.index({ username: "text", email: "text", city: "text" });

export default mongoose.model("User", userSchema);
