export function validateCreateBoard(payload) {
	const errors = [];

	if (!payload.name || typeof payload.name !== "string") {
		errors.push("Board name is required.");
	} else if (payload.name.trim().length < 2) {
		errors.push("Board name must be at least 2 characters.");
	}

	if (
		payload.description !== undefined &&
		payload.description !== null &&
		typeof payload.description !== "string"
	) {
		errors.push("Description must be a string.");
	}

	return errors;
}

export function validateUpdateBoard(payload) {
	const errors = [];

	if (payload.name !== undefined) {
		if (typeof payload.name !== "string" || payload.name.trim().length < 2) {
			errors.push("Board name must be at least 2 characters.");
		}
	}

	if (
		payload.description !== undefined &&
		payload.description !== null &&
		typeof payload.description !== "string"
	) {
		errors.push("Description must be a string.");
	}

	return errors;
}
