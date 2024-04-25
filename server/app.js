import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import connectDB from "./src/db/db.js";
import { config as dotenvConfig } from "dotenv";
import { sendEmail } from "./src/utility/sendEmail.js";
dotenvConfig();
const app = express();
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

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
