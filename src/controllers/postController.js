import { uploadToCloudinary } from "../utility/cloudinary.js";
import Posts from "../models/postModel.js";

async function createPost(req, res) {
	try {
		const { id } = req.user;

		const avatarLocalPath = req.file?.path;
		console.log("avatarLocalPath", avatarLocalPath);

		if (avatarLocalPath) {
			const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
			const { url } = cloudinaryResponse;
			console.log("url", url);
			req.body.image = url;
		}

		const { description, image } = req.body;

		const newPost = new Posts({
			description,
			image,
			author: id,
		});

		const savedPost = await newPost.save();
		res.status(200).json(savedPost);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllPosts(req, res) {
	try {
		const { id } = req.user;
		console.log("id", id);

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const posts = await Posts.find()
			.populate("author")
			.select("-password -otp -otp_expiry");
		if (!posts) {
			return res.status(404).json({ message: "No posts found" });
		}
		res.status(200).json(posts);
	} catch (error) {
		console.error(error);
		if (error.name === "CastError") {
			return res.status(400).json({ message: "Invalid request body" });
		}
		if (error.name === "ValidationError") {
			return res.status(400).json({ message: "Invalid request body" });
		}
		if (error.name === "MissingSchemaError") {
			return res
				.status(500)
				.json({
					message:
						"Internal server error: Schema hasn't been registered for model User",
				});
		}
		return res.status(500).json({ message: "Internal server error" });
	}
}

export { createPost, getAllPosts };
