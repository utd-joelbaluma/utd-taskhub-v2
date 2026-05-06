const allowedStatuses = ["planning", "in-progress", "on-hold", "completed"];

function validateSprintFields(payload, errors) {
	if (
		payload.sprint_name !== undefined &&
		payload.sprint_name !== null &&
		typeof payload.sprint_name !== "string"
	) {
		errors.push("Sprint name must be a string.");
	}

	if (
		payload.sprint_end_date !== undefined &&
		payload.sprint_end_date !== null
	) {
		const d = new Date(payload.sprint_end_date);
		if (isNaN(d.getTime())) {
			errors.push("Sprint end date must be a valid date.");
		}
	}

	if (payload.tags !== undefined) {
		if (
			!Array.isArray(payload.tags) ||
			payload.tags.some((t) => typeof t !== "string")
		) {
			errors.push("Tags must be an array of strings.");
		}
	}
}

export function validateCreateProject(payload) {
	const errors = [];

	if (!payload.name || typeof payload.name !== "string") {
		errors.push("Project name is required.");
	}

	if (payload.name && payload.name.trim().length < 2) {
		errors.push("Project name must be at least 2 characters.");
	}

	if (payload.status && !allowedStatuses.includes(payload.status)) {
		errors.push(`Status must be one of: ${allowedStatuses.join(", ")}.`);
	}

	validateSprintFields(payload, errors);

	return errors;
}

export function validateUpdateProject(payload) {
	const errors = [];

	if (payload.name !== undefined) {
		if (
			typeof payload.name !== "string" ||
			payload.name.trim().length < 2
		) {
			errors.push("Project name must be at least 2 characters.");
		}
	}

	if (
		payload.status !== undefined &&
		!allowedStatuses.includes(payload.status)
	) {
		errors.push(`Status must be one of: ${allowedStatuses.join(", ")}.`);
	}

	validateSprintFields(payload, errors);

	return errors;
}
