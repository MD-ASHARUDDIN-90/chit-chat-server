import User from "../models/userModel.js";
import Posts from "../models/postModel.js";
import { uploadToCloudinary } from "../utility/cloudinary.js";
import {
	comparePassword,
	createHashedPassword,
} from "../utility/hashedPassword.js";
import { buildQueryObject } from "../utility/dbQueryHelper.js";
import { getPaginatedResults } from "../utility/getPaginatedResult.js";

async function getUserData(req, res) {
	try {
		const { id } = req.user;
		const user = await User.findById(id).select("-password -otp -otp_expiry");
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

		const user = await User.findByIdAndUpdate(id, req.body, {
			new: true,
		}).select("-password -otp -otp_expiry");
		console.log("user", user);
		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function updateUserPassword(req, res) {
	try {
		const { id } = req.user;
		const user = await User.findById(id);

		const { currentPassword, newPassword, confirmNewPassword } = req.body;

		const match = await comparePassword(currentPassword, user.password);
		if (!match) {
			return res.status(401).json({ message: "Invalid current password" });
		}

		if (newPassword !== confirmNewPassword) {
			return res.status(400).json({
				message: "New password and confirm new password do not match",
			});
		}

		user.password = await createHashedPassword(newPassword);
		await user.save();
		res.status(200).json({ message: "Password Updated Successfully" });
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getMyPosts(req, res) {
	try {
		const { id } = req.user;
		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const { page, limit, filterObject } = buildQueryObject(req);

		filterObject.author = id; //add filter for author

		const populateOptions = [
			{
				path: "author",
				select: "-password -otp -otp_expiry",
			},
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

		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function updateDisplayPicture(req, res) {
	try {
		const { id } = req.user;
		const avatarLocalPath = req.file?.path;
		console.log("avatarLocalPath", avatarLocalPath);

		if (avatarLocalPath) {
			const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
			const { url, public_id } = cloudinaryResponse;
			console.log("url", url);
			req.body.displayPicture = url;
		}

		const user = await User.findByIdAndUpdate(id, req.body, {
			new: true,
		}).select("-password -otp -otp_expiry");
		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getPeopleYouMayKnow(req, res) {
	try {
		let { id } = req.user;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const currentUser = await User.findById(id).select(
			"-password -otp -otp_expiry",
		);

		// Pass excludeIds to buildQueryObject only if necessary
		const excludeIds = [
			...currentUser.following,
			...currentUser.friends,
			...currentUser.removedSuggestions,
			id,
		];
		const { page, limit, filterObject } = buildQueryObject(req, excludeIds);

		// Define fields to select and populate options
		const selectFields = "-password -otp -otp_expiry -socketId "; // Adjust fields as needed
		const populateOptions = []; // Add any necessary populate options

		// Get paginated results
		const peopleYouMayKnow = await getPaginatedResults(
			User,
			filterObject,
			page,
			limit,
			populateOptions,
			selectFields,
		);

		// Respond with the paginated results
		res.status(200).json(peopleYouMayKnow);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getPeopleYouFollow(req, res) {
	try {
		let { id } = req.user;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const currentUser = await User.findById(id).select(
			"-password -otp -otp_expiry",
		);

		// Get the list of user IDs that the current user is following
		const followingIds = currentUser.following.map((f) => f._id);

		// If followingIds is empty, return an empty result set
		if (followingIds.length === 0) {
			return res
				.status(200)
				.json({ data: [], total: 0, page: 1, limit: 10, filter: {} });
		}

		const { page, limit, filterObject } = buildQueryObject(
			req,
			[id],
			followingIds,
		);
		const selectFields = "-password -otp -otp_expiry -socketId "; // Adjust fields as needed
		const populateOptions = []; // Add any necessary populate options
		const peopleYouFollow = await getPaginatedResults(
			User,
			filterObject,
			page,
			limit,
			populateOptions,
			selectFields,
		);
		res.status(200).json(peopleYouFollow);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function followUserRequestHandler(req, res) {
	try {
		const { id } = req.user;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const { targetUserId, action } = req.body;
		const user = await User.findById(id);
		const targetUser = await User.findById(targetUserId);

		if (!user || !targetUser) {
			return res.status(404).json({ message: "User not found" });
		}

		if (action === "follow") {
			if (!user.following.includes(targetUserId)) {
				user.following.push(targetUserId);
				targetUser.followers.push(id);
				await Promise.all([user.save(), targetUser.save()]);
				return res.status(200).json({ message: "User followed successfully" });
			}
		} else if (action === "unfollow") {
			if (user.following.includes(targetUserId)) {
				user.following = user.following.filter(
					(userId) => userId.toString() !== targetUserId,
				);

				if (user.removedSuggestions.includes(targetUserId)) {
					console.log("targetUserId removing 1", targetUserId);
					user.removedSuggestions = user.removedSuggestions.filter(
						(userId) => userId.toString() !== targetUserId,
					);
				}
				targetUser.followers = targetUser.followers.filter(
					(userId) => userId.toString() !== id,
				);
				await Promise.all([user.save(), targetUser.save()]);
				return res
					.status(200)
					.json({ message: "User unfollowed successfully" });
			}
		} else if (action === "remove") {
			if (!user.removedSuggestions.includes(targetUserId)) {
				console.log("targetUserId removing 2", targetUserId);
				user.removedSuggestions.push(targetUserId);
				await Promise.all([user.save(), targetUser.save()]);
				return res.status(200).json({ message: "User removed successfully" });
			}
		}
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

async function searchUsers(req, res) {
	try {
		let { id } = req.user;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const currentUser = await User.findById(id).select(
			"-password -otp -otp_expiry",
		);

		if (!currentUser) {
			return res.status(404).json({ message: "User not found" });
		}

		const excludeIds = [id];

		const { page, limit, filterObject } = buildQueryObject(req, excludeIds);

		// Define fields to select and populate options
		const selectFields = "-password -otp -otp_expiry -socketId "; // Adjust fields as needed
		const populateOptions = []; // Add any necessary populate options

		const usersFound = await getPaginatedResults(
			User,
			filterObject,
			page,
			limit,
			populateOptions,
			selectFields,
		);

		res.status(200).json(usersFound);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

export {
	getUserData,
	updateUserData,
	updateUserPassword,
	getMyPosts,
	updateDisplayPicture,
	getPeopleYouMayKnow,
	followUserRequestHandler,
	getPeopleYouFollow,
	searchUsers,
};
