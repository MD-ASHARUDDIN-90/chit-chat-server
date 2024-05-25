function buildQueryObject(req, excludeIds = [], includeIds = []) {
	const { page = 1, limit = 10, search = "", filter = "{}" } = req.query;
	console.log("page", page, "limit", limit, "search", search, "filter", filter);

	// Parse filter parameters
	let parsedFilter = {};
	try {
		parsedFilter = JSON.parse(filter);
	} catch (error) {
		console.error("Error parsing filter parameter: ", error);
	}

	// Build the filter conditions array
	let conditions = [
		...Object.keys(parsedFilter).map((key) => {
			return { [key]: parsedFilter[key] };
		}),
	];

	// Only add $text search if a search string is provided
	if (search) {
		conditions.push({ $text: { $search: search } });
	}

	// Add exclusion of certain user IDs if provided
	if (excludeIds.length > 0) {
		conditions.push({ _id: { $nin: excludeIds } });
	}

	// Include only the users with IDs in includeIds
	if (includeIds.length > 0) {
		conditions.push({ _id: { $in: includeIds } });
	}

	// Build the filter object
	let filterObject = {};

	// Only add $and if there are conditions
	if (conditions.length > 0) {
		filterObject.$and = conditions;
	}

	return {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		filterObject: filterObject,
	};
}

export { buildQueryObject };
