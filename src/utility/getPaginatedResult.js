async function getPaginatedResults(
	model,
	filterObject,
	page,
	limit,
	populateOptions = [],
	selectFields = "",
) {
	console.log("page", page, "limit", limit, "filterObject", filterObject);
	try {
		let query = model
			.find(filterObject)
			.select(selectFields)
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		populateOptions.forEach((option) => {
			query = query.populate(option);
		});

		const results = await query.exec();

		// Get the total number of documents that match the filter criteria
		const total = await model.countDocuments(filterObject);

		return {
			data: results,
			total: total,
			page: page,
			limit: limit,
			filter: filterObject,
		};
	} catch (error) {
		console.error("Error getting paginated results", error);
		throw new Error("Internal server error");
	}
}

export { getPaginatedResults };
