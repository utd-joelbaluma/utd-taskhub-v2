const allowedStatuses = ["active", "completed", "archived"];

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

	return errors;
}
