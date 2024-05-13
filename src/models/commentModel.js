//create comment model

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
	description: String,
	image: String,
	createdAt: {
		type: Date,
		default: Date.now,
	},
	likes: {
		type: Number,
		default: 0,
	},
	comments: Number,
	replies: Number,
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Posts",
	},
});

export default mongoose.model("Comment", commentSchema);
