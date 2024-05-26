import User from "../models/userModel.js";
import Posts from "../models/postModel.js";
import { uploadToCloudinary } from "../utility/cloudinary.js";
import {
	comparePassword,
	createHashedPassword,
} from "../utility/hashedPassword.js";
import { buildQueryObject } from "../utility/dbQueryHelper.js";
import { getPaginatedResults } from "../utility/getPaginatedResult.js";
import { io } from "../utility/socket.js";

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

// async function friendRequestHandler(req, res) {
// 	try {
// 		const { id } = req.user;
// 		const { targetUserId, action } = req.body;

// 		if (!id) {
// 			return res.status(401).json({ message: "Unauthorized" });
// 		}

// 		const user = await User.findById(id);
// 		const targetUser = await User.findById(targetUserId);

// 		if (!user || !targetUser) {
// 			return res.status(404).json({ message: "User not found" });
// 		}

// 		if (action === "send") {
// 			if (!user.friendRequestsSent.includes(targetUserId)) {
// 				user.friendRequestsSent.push(targetUserId);
// 				targetUser.friendRequestsReceived.push(id);
// 				if (!user.following.includes(targetUserId)) {
// 					user.following.push(targetUserId);
// 				}
// 				if (!targetUser.followers.includes(id)) {
// 					targetUser.followers.push(id);
// 				}
// 				await Promise.all([user.save(), targetUser.save()]);
// 				return res
// 					.status(200)
// 					.json({ message: "Friend request sent successfully" });
// 			}
// 		} else if (action === "cancel") {
// 			if (user.friendRequestsSent.includes(targetUserId)) {
// 				user.friendRequestsSent = user.friendRequestsSent.filter(
// 					(userId) => userId.toString() !== targetUserId,
// 				);

// 				targetUser.friendRequestsReceived =
// 					targetUser.friendRequestsReceived.filter(
// 						(userId) => userId.toString() !== id,
// 					);
// 				await Promise.all([user.save(), targetUser.save()]);
// 				return res
// 					.status(200)
// 					.json({ message: "Friend request cancelled successfully" });
// 			}
// 		} else if (action === "accept") {
// 			if (!user.friends.includes(targetUserId)) {
// 				user.friends.push(targetUserId);
// 				targetUser.friends.push(id);

// 				user.friendRequestsSent = user.friendRequestsSent.filter(
// 					(userId) => userId.toString() !== targetUserId,
// 				);
// 				targetUser.friendRequestsReceived =
// 					targetUser.friendRequestsReceived.filter(
// 						(userId) => userId.toString() !== id,
// 					);

// 				if (!user.following.includes(targetUserId)) {
// 					user.following.push(targetUserId);
// 				}

// 				if (!user.followers.includes(targetUserId)) {
// 					user.followers.push(targetUserId);
// 				}

// 				if (!targetUser.following.includes(id)) {
// 					targetUser.following.push(id);
// 				}

// 				if (!targetUser.followers.includes(id)) {
// 					targetUser.followers.push(id);
// 				}

// 				if (user.removedSuggestions.includes(targetUserId)) {
// 					user.removedSuggestions = user.removedSuggestions.filter(
// 						(userId) => userId.toString() !== targetUserId,
// 					);
// 				}

// 				if (targetUser.removedSuggestions.includes(id)) {
// 					targetUser.removedSuggestions = targetUser.removedSuggestions.filter(
// 						(userId) => userId.toString() !== id,
// 					);
// 				}

// 				await Promise.all([user.save(), targetUser.save()]);
// 				return res.status(200).json({ message: "Friend request accepted" });
// 			}
// 		} else if (action === "decline") {
// 			if (user.friends.includes(targetUserId)) {
// 				user.friends = user.friends.filter(
// 					(userId) => userId.toString() !== targetUserId,
// 				);
// 				targetUser.friends = targetUser.friends.filter(
// 					(userId) => userId.toString() !== id,
// 				);

// 				user.friendRequestsSent = user.friendRequestsSent.filter(
// 					(userId) => userId.toString() !== targetUserId,
// 				);
// 				targetUser.friendRequestsReceived =
// 					targetUser.friendRequestsReceived.filter(
// 						(userId) => userId.toString() !== id,
// 					);

// 				await Promise.all([user.save(), targetUser.save()]);
// 				return res.status(200).json({ message: "Friend request declined" });
// 			}
// 		}
// 	} catch (error) {
// 		res.status(500).json({ message: "Internal server error" });
// 	}
// }

async function friendRequestHandler(req, res) {
	try {
		const { id } = req.user;
		const { targetUserId, action } = req.body;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const [user, targetUser] = await Promise.all([
			User.findById(id),
			User.findById(targetUserId),
		]);

		if (!user || !targetUser) {
			return res.status(404).json({ message: "User not found" });
		}

		let message = "Action could not be performed";
		let eventName = "";
		switch (action) {
			case "send":
				if (!user.friendRequestsSent.includes(targetUserId)) {
					user.friendRequestsSent.push(targetUserId);
					targetUser.friendRequestsReceived.push(id);

					if (!user.following.includes(targetUserId)) {
						user.following.push(targetUserId);
						targetUser.followers.push(id);
					}

					await Promise.all([user.save(), targetUser.save()]);
					message = "Friend request sent successfully";
					eventName = "friendRequestSent";
				}
				break;

			case "cancel":
				if (user.friendRequestsSent.includes(targetUserId)) {
					user.friendRequestsSent = user.friendRequestsSent.filter(
						(userId) => userId.toString() !== targetUserId,
					);
					targetUser.friendRequestsReceived =
						targetUser.friendRequestsReceived.filter(
							(userId) => userId.toString() !== id,
						);

					await Promise.all([user.save(), targetUser.save()]);
					message = "Friend request cancelled successfully";
					eventName = "friendRequestCancelled";
				}
				break;

			case "accept":
				console.log("accept", 0);
				if (user.friendRequestsReceived.includes(targetUserId)) {
					console.log("accept", 1);
					user.friends.push(targetUserId);
					targetUser.friends.push(id);

					targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
						(userId) => userId.toString() !== id,
					);
					user.friendRequestsReceived = user.friendRequestsReceived.filter(
						(userId) => userId.toString() !== targetUserId,
					);
					console.log("accept", 2);

					if (!user.following.includes(targetUserId)) {
						user.following.push(targetUserId);
						targetUser.followers.push(id);
					}

					if (!targetUser.following.includes(id)) {
						targetUser.following.push(id);
						user.followers.push(targetUserId);
					}

					console.log("accept", 3);

					if (user.removedSuggestions.includes(targetUserId)) {
						user.removedSuggestions = user.removedSuggestions.filter(
							(userId) => userId.toString() !== targetUserId,
						);
					}
					if (targetUser.removedSuggestions.includes(id)) {
						targetUser.removedSuggestions =
							targetUser.removedSuggestions.filter(
								(userId) => userId.toString() !== id,
							);
					}
					console.log("accept", 4);

					await Promise.all([user.save(), targetUser.save()]);
					message = "Friend request accepted";
					eventName = "friendRequestAccepted";
				}
				break;

			case "decline":
				console.log(
					"declining request",
					"id",
					id,
					"targetUserId",
					targetUserId,
				);
				if (user.friendRequestsReceived.includes(targetUserId)) {
					console.log("declining request", 1);
					user.friendRequestsReceived = user.friendRequestsReceived.filter(
						(userId) => userId.toString() !== targetUserId,
					);
					targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
						(userId) => userId.toString() !== id,
					);

					console.log("declining request", 2);

					await Promise.all([user.save(), targetUser.save()]);
					message = "Friend request declined";
					eventName = "friendRequestDeclined";
				}
				break;
			case "unfriend":
				console.log("unfriend", 0);
				console.log("unfriend", user.friends);
				console.log("unfriend", user.friends.includes(targetUserId));
				if (user.friends.includes(targetUserId)) {
					console.log("unfriend", 1);
					user.friends = user.friends.filter(
						(userId) => userId.toString() !== targetUserId,
					);
					targetUser.friends = targetUser.friends.filter(
						(userId) => userId.toString() !== id,
					);
					console.log("unfriend", 2);
					await Promise.all([user.save(), targetUser.save()]);
					message = "Unfriended successfully";
					eventName = "unfriend";
				}
				break;

			default:
				return res.status(400).json({ message: "Invalid action" });
		}

		if (eventName) {
			console.log("socket target", targetUser.socketId);
			io.to(targetUser.socketId).emit(eventName, {
				info: message,
				from: user.username,
				to: targetUser.username,
			});
		}

		return res.status(200).json({ message });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllFriendsRequests(req, res) {
	try {
		const { id } = req.user;
		const { action } = req.params;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const currentUser = await User.findById(id).select(
			"-password -otp -otp_expiry",
		);
		if (!currentUser) {
			return res.status(404).json({ message: "User not found" });
		}

		// Get the list of user IDs that the current user has received friend requests from or sent friend requests to

		let receivedRequestOrSentRequestIds;
		if (action === "friendRequestsSent") {
			receivedRequestOrSentRequestIds = currentUser.friendRequestsSent.map(
				(f) => f._id,
			);
		} else if (action === "friendRequestsReceived") {
			receivedRequestOrSentRequestIds = currentUser.friendRequestsReceived.map(
				(f) => f._id,
			);
		}

		if (receivedRequestOrSentRequestIds.length === 0) {
			return res
				.status(200)
				.json({ data: [], total: 0, page: 1, limit: 10, filter: {} });
		}

		const { page, limit, filterObject } = buildQueryObject(
			req,
			[id],
			receivedRequestOrSentRequestIds,
		);
		const selectFields = "-password -otp -otp_expiry -socketId "; // Adjust fields as needed
		const populateOptions = []; // Add any necessary populate options
		const receivedFriendRequestsOrSentFriendRequests =
			await getPaginatedResults(
				User,
				filterObject,
				page,
				limit,
				populateOptions,
				selectFields,
			);
		res.status(200).json(receivedFriendRequestsOrSentFriendRequests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllMyFriends(req, res) {
	try {
		const { id } = req.user;

		if (!id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const currentUser = await User.findById(id).select(
			"-password -otp -otp_expiry",
		);
		if (!currentUser) {
			return res.status(404).json({ message: "User not found" });
		}

		// Get the list of user IDs that the current user has received friend requests from or sent friend requests to

		const myFriendIds = currentUser.friends.map((f) => f._id);

		if (myFriendIds.length === 0) {
			return res
				.status(200)
				.json({ data: [], total: 0, page: 1, limit: 10, filter: {} });
		}

		const { page, limit, filterObject } = buildQueryObject(
			req,
			[id],
			myFriendIds,
		);
		const selectFields = "-password -otp -otp_expiry -socketId "; // Adjust fields as needed
		const populateOptions = []; // Add any necessary populate options
		const myFriendsList = await getPaginatedResults(
			User,
			filterObject,
			page,
			limit,
			populateOptions,
			selectFields,
		);
		res.status(200).json(myFriendsList);
	} catch (error) {
		console.error(error);
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
	friendRequestHandler,
	getAllFriendsRequests,
	getAllMyFriends,
};
