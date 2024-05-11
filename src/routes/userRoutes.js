import express from "express";
import { getUserData, updateUserData } from "../controllers/userController.js";
import { uploadMiddleware } from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/", getUserData);
router.put("/update", uploadMiddleware, updateUserData);

export default router;
