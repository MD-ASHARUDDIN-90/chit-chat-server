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

export { createPost };
