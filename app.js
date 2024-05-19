/**
 * @module app
 * @description Main entry point for the ChitChat backend server.
 * @summary ChitChat Backend Server with REST API and routes like authentication, user, post, comment and message.
 * @author [Ashar](https://github.com/MD-ASHARUDDIN-90)
 */

import express from "express";
import http from "http";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";
import commentRoutes from "./src/routes/commentRoutes.js";
import refreshToken from "./src/routes/refreshTokenRoutes.js";
import message from "./src/routes/messageRoutes.js";
import connectDB from "./src/db/db.js";
import { config as dotenvConfig } from "dotenv";
import { sendEmail } from "./src/utility/sendEmail.js";
import { uploadMiddleware } from "./src/middleware/multerMiddleware.js";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "./src/utility/cloudinary.js";
import { useMorgan } from "./src/utility/serverHelper.js";
import { authMiddleware } from "./src/middleware/authMiddleware.js";
import { setupSocketIO } from "./src/utility/socket.js";

dotenvConfig();

const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 8080;

//middleware
useMorgan(app); //logs requests
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/message", message);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/post", authMiddleware, postRoutes);
app.use("/api/comment", authMiddleware, commentRoutes);
app.use("/api/refresh-token", refreshToken);
app.get("/api/check", (req, res) => {
	console.log(" Hi I am ChitChat Backend Server and Working");
	res.status(200).send("Hi I am ChitChat Backend Server and Working");
});

/*
 * Route to check if the mail is up and running.
 * Route to send an email.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The email to send to.
 * @param {string} req.body.subject - The subject of the email.
 * @param {string} req.body.text - The text content of the email.
 * @param {string} req.body.html - The html content of the email.
 * @param {Object} res - The response object.
 * @return {string} The response indicating whether the email was sent successfully or not.
 */
app.post("/send-email", async (req, res) => {
	try {
		const { email, subject, text, html } = req.body;
		await sendEmail(email, subject, text, html);
		res.status(200).send("Email sent successfully");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error sending email");
	}
});

/**
 * Route for uploading a file.
 * Testing purposes only.
 * @name /upload
 * @function
 * @param  req - The request object.
 * @param  res - The response object.
 * @param {Object} req - The request object.
 * @param {Object} req.file - The uploaded file.
 * @param {string} req.file.path - The path of the uploaded file.
 * @param {Object} res - The response object.
 * @return {string} The URL of the uploaded file.
 */
app.post("/upload", uploadMiddleware, async (req, res) => {
	// Extract the path of the uploaded file.
	const avatarLocalPath = req.file?.path;

	// If the file is not found, throw an error.
	if (!avatarLocalPath) {
		throw new Error("File not found");
	}
	try {
		// Upload the file to cloudinary and get the URL.
		const url = await uploadToCloudinary(avatarLocalPath);
		// Send the URL as the response.
		res.status(200).send(url);
	} catch (error) {
		// Log the error and send a 500 status code.
		console.error(error);
		res.status(500).send("Error uploading file");
	}
});

/**
 * Route for deleting a file from Cloudinary.
 * Testing purposes only.
 * @name /delete
 * @function
 * @param  req - The request object.
 * @param  res - The response object.
 */
app.delete("/delete", async (req, res) => {
	try {
		const { url } = req.body;
		await deleteFromCloudinary(url);
		res.status(200).send("File deleted successfully");
	} catch (error) {
		console.error(error);
		res.status(500).send("Error deleting file");
	}
});

//error handling
app.use((err, req, res, next) => {
	console.error(err.stack);

	const statusCode = err.statusCode ?? 500;
	const errorMessage = err.message ?? "Internal Server Error";

	res.status(statusCode).send(errorMessage);
});

// Setup Socket.IO
setupSocketIO(server);

/**
 * Function to connect to the database and start the server.
 * @function connectDB
 */
connectDB()
	.then(() => {
		server.listen(port, () => {
			console.log(`⚙️  Server is running on port:  ${port}`);
		});
	})
	.catch((err) => {
		console.error("Unable to connect to database:", err.message);
		process.exit(1);
	});
