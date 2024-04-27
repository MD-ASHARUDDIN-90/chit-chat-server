import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transport = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS,
	},
});

export async function sendEmail(email, subject, text, html) {
	try {
		const info = await transport.sendMail({
			from: "chitchatchattingapp@gmail.com",
			to: email,
			subject: subject,
			text: text,
			html: html,
		});
		return info;
	} catch (error) {
		console.error("Failed to send email:", error);
		throw error;
	}
}
