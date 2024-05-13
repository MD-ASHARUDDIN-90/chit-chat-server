import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../utility/cloudinary.js";
import Posts from "../models/postModel.js";

async function createPost(req, res) {
	try {
		const { id } = req.user;

		const avatarLocalPath = req.file?.path;
		console.log("avatarLocalPath", avatarLocalPath);

		if (avatarLocalPath) {
			const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
			const { url, public_id } = cloudinaryResponse;
			console.log("url", url);
			req.body.image = url;
			req.body.image_id = public_id;
		}

		const { description, image, image_id } = req.body;
		//if description or image is not provided then send error but if both are proven then proceed to create post
		// it means atleast one of them is required
		if (!description && !image) {
			//delete image from cloudinary if it was uploaded
			if (image_id) await deleteFromCloudinary(image_id);
			return res
				.status(400)
				.json({ message: "Description or image is required" });
		}

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
			.select("-password -otp -otp_expiry")
			.sort({ createdAt: -1 });
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
			return res.status(500).json({
				message:
					"Internal server error: Schema hasn't been registered for model User",
			});
		}
		return res.status(500).json({ message: "Internal server error" });
	}
}

export { createPost, getAllPosts };
