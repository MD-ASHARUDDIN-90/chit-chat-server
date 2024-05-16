/**
 * @module postController
 * @description Controller for posts
 * @summary Controller for posts handling requests and responses
 * @class postController
 * @classdesc Controller for posts
 * @exports postController
 *
 * @author [Ashar](https://github.com/MD-ASHARUDDIN-90)
 *
 */

import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../utility/cloudinary.js";
import Posts from "../models/postModel.js";
import Comment from "../models/commentModel.js";
import { buildQueryObject } from "../utility/dbQueryHelper.js";
import { getPaginatedResults } from "../utility/getPaginatedResult.js";

/**
 * Async function to create a new post based on the request body data.
 *
 * @param {Object} req - The request object containing user information and file data.
 * @param {Object} res - The response object to send back the result.
 * @return {Object} The saved post data or an error message.
 */
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

/**
 * Async function to get all posts based on the request parameters.
 *
 * @param {Object} req - The request object containing user information and query parameters.
 * @param {Object} res - The response object to send back the retrieved posts or error messages.
 * @return {Object} The retrieved posts or an error message.
 */
async function getAllPosts(req, res) {
	try {
		const { id } = req.user;
		console.log("id", id);

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		console.log("req.query", req.query);

		const { page, limit, filterObject } = buildQueryObject(req);

		const populateOptions = [
			{
				path: "author",
				select: "-password -otp -otp_expiry",
			},
			// Add more paths to populate as needed
		];

		const selectFields = ""; // Add the fields you want to select from the Posts model

		const posts = await getPaginatedResults(
			Posts,
			filterObject,
			page,
			limit,
			populateOptions,
			selectFields,
		);

		// console.log("posts --->>", posts);

		if (!posts) {
			return res.status(404).json({ message: "No posts found" });
		}
		res.status(200).json(posts);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

/**
 * Async function to get a post by its ID and populate comments with pagination.
 *
 * @param {Object} req - The request object containing post ID and pagination parameters.
 * @param {Object} res - The response object to send back the post with paginated comments or error messages.
 * @return {Object} The post with paginated comments or an error message.
 */
async function getPostById(req, res) {
	try {
		const { id } = req.params;
		const { page = 1, limit = 10 } = req.query; // Add pagination parameters

		const post = await Posts.findById(id).populate({
			path: "author",
			select: "-password -otp -otp_expiry",
		});

		// console.log("post", post);

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// Get paginated comments
		// const paginatedComments = await getPaginatedResults(
		// 	Comment, // Assuming Comment is your comment model
		// 	{ _id: { $in: post.comments } }, // Filter comments that are in post.comments
		// 	page,
		// 	limit,
		// 	[
		// 		{
		// 			// Populate author in each comment
		// 			path: "author",
		// 			select: "-password -otp -otp_expiry",
		// 		},
		// 	],
		// );

		// // Add paginated comments to the post object format expected by the frontend
		// post.comments = paginatedComments.data;
		// paginatedComments.data = post;

		res.status(200).json(post);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
}

export { createPost, getAllPosts, getPostById };
