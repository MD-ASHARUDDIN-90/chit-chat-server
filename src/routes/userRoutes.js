import express from "express";
import {
	getMyPosts,
	getUserData,
	updateDisplayPicture,
	updateUserData,
	updateUserPassword,
	getPeopleYouMayKnow,
	followUserRequestHandler,
	getPeopleYouFollow,
	searchUsers,
	friendRequestHandler,
} from "../controllers/userController.js";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/", getUserData);
router.get("/posts", getMyPosts);
router.put("/update", uploadMiddleware, updateUserData);
router.put("/update/display-picture", uploadMiddleware, updateDisplayPicture);
router.put("/update-password", updateUserPassword);
router.get("/people-you-may-know", getPeopleYouMayKnow);
router.post("/follow-user", followUserRequestHandler);
router.get("/following", getPeopleYouFollow);
router.get("/search-people", searchUsers);
router.post("/friend-request", friendRequestHandler);

export default router;
