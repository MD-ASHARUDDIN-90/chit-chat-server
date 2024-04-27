const getAllMessages = async (req, res) => {
	try {
		const user = req.user;
		console.log("user", user);
		console.log("hello access given  ", user);
		const message = { message: `hello access given to ${user.id}` };
		return res.status(200).json(message);
	} catch (error) {
		const errorResponse = { message: error.message };
		return res.status(500).json(errorResponse);
	}
};

export { getAllMessages };
