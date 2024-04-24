const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const connectDB = require("./src/db/db");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
//ashar access
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
