//want to create a model for posts by users

import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
	title: String,
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
	comments: {
		type: Number,
		default: 0,
	},
	share: {
		type: Number,
		default: 0,
	},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
	tags: [String],
	views: Number,
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
});

// Create a text index on the title, description, and tags fields for full-text search
postSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Posts", postSchema);
