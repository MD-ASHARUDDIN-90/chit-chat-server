import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(localFilePath) {
	try {
		if (!localFilePath) {
			throw new Error(`File not found: ${localFilePath}`);
		}
		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
			folder: "chit-chat",
		});

		console.log("File uploaded successfully", response);
		fs.unlinkSync(localFilePath);
		return response;
	} catch (error) {
		fs.unlinkSync(localFilePath);
		//remove file from server if upload fails
		console.error("Error uploading file:", error);
		return null;
	}
}

export async function deleteFromCloudinary(publicId) {
	try {
		if (!publicId) {
			throw new Error("Public ID not provided");
		}
		const result = await cloudinary.uploader.destroy(publicId);
		console.log("Result from Cloudinary:", result);

		if (result.result === "ok") {
			console.log("File deleted successfully");
		} else {
			console.error("Failed to delete file. Cloudinary response:", result);
			throw new Error("Failed to delete file");
		}
	} catch (error) {
		console.error("Error deleting file:", error);
		throw error;
	}
}
