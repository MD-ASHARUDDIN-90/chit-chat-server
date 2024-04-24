import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import connectDB from "./src/db/db.js";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
const app = express();
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());
app.use("/", authRoutes);

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

connectDB()
	.then(() => {
		app.listen(port, () => {
			console.log(`⚙️  Server is running on port:  ${port}`);
		});
	})
	.catch((err) => {
		console.error("Unable to connect to database:", err.message);
		process.exit(1);
	});
