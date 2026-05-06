export function validateCreateComment(payload) {
	const errors = [];

	if (!payload.body || typeof payload.body !== "string" || payload.body.trim().length === 0) {
		errors.push("Body is required.");
	}

	return errors;
}

export function validateUpdateComment(payload) {
	const errors = [];

	if (payload.body !== undefined) {
		if (typeof payload.body !== "string" || payload.body.trim().length === 0) {
			errors.push("Body must be a non-empty string.");
		}
	}

	return errors;
}
