import { Server as SocketIOServer } from "socket.io";
// Adjust the path as needed
import User from "../models/userModel.js"; // Adjust the path as needed
import { verifyToken } from "../middleware/authMiddleware.js";

let io;

const setupSocketIO = (server) => {
	io = new SocketIOServer(server, {
		cors: {
			origin: "*", // Update this with your client URL
			methods: ["GET", "POST", "PUT", "DELETE"],
		},
	});

	// Socket.IO middleware to authenticate socket connections
	io.use((socket, next) => {
		const token = socket.handshake.auth.token;
		if (token) {
			const decoded = verifyToken(token); // Assuming verifyAccessToken function returns user data if token is valid
			if (decoded) {
				socket.user = decoded;
				next();
			} else {
				next(new Error("Authentication error"));
			}
		} else {
			next(new Error("Authentication error"));
		}
	});

	// Socket.IO connection handling
	io.on("connection", async (socket) => {
		const user = socket.user;

		console.log("User socket connected: ", user, "socketID", socket.id);

		// Update the user's socketId in the database
		await User.findByIdAndUpdate(user.id, { socketId: socket.id });

		socket.on("disconnect", async () => {
			// Remove the user's socketId from the database
			console.log(
				"User socket disconnected: ",
				user.username,
				"socketID",
				socket.id,
			);
			await User.findByIdAndUpdate(user.id, { socketId: null });
		});

		// Additional event listeners...
	});

	return io;
};

export { setupSocketIO, io };
