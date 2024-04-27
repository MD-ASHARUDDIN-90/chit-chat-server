import mongoose from "mongoose";

const Schema = mongoose.Schema;

//create user token model here with user id and token and expiresAt
const userTokenSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, required: true },
	token: { type: String, required: true },
	expiresAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 }, // 7 days
});

const UserToken = mongoose.model("UserToken", userTokenSchema);
export default UserToken;
