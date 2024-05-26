import multer from "multer";

const fileDirectory =
	process.env.NODE_ENV === "production" ? "./public/temp" : "./tmp";

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, fileDirectory);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.originalname);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 1024 * 1024 * 5 }, // Limiting file size to 5MB
});

export const uploadMiddleware = upload.single("file");

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		// A Multer error occurred when uploading
		if (err.code === "LIMIT_FILE_SIZE") {
			return res.status(400).send({ message: "File size too large" });
		}
		// Handle other Multer errors as needed
	} else if (err) {
		// An unknown error occurred
		return res.status(500).send({ message: "Internal server error" });
	}
	// If no error occurred, proceed to the next middleware
	next();
};
