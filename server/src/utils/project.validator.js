const allowedStatuses = ["planning", "in-progress", "on-hold", "completed"];
const allowedIconTypes = ["icon", "image"];
const maxIconValueLength = 1_000_000;
const PROJECT_KEY_RE = /^[A-Z0-9]{2,10}$/;

export function validateProjectKey(key) {
	if (typeof key !== "string") return "Project key must be a string.";
	if (!PROJECT_KEY_RE.test(key)) {
		return "Project key must be 2-10 uppercase letters or digits.";
	}
	return null;
}

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

function validateIconFields(payload, errors) {
	if (
		payload.icon_type !== undefined &&
		payload.icon_type !== null &&
		!allowedIconTypes.includes(payload.icon_type)
	) {
		errors.push(`Icon type must be one of: ${allowedIconTypes.join(", ")}.`);
	}

	if (
		payload.icon_value !== undefined &&
		payload.icon_value !== null &&
		typeof payload.icon_value !== "string"
	) {
		errors.push("Icon value must be a string.");
	}

	if (
		typeof payload.icon_value === "string" &&
		payload.icon_value.length > maxIconValueLength
	) {
		errors.push("Icon image is too large.");
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

	if (payload.key !== undefined && payload.key !== null && payload.key !== "") {
		const err = validateProjectKey(payload.key);
		if (err) errors.push(err);
	}

	validateSprintFields(payload, errors);
	validateIconFields(payload, errors);

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

	if (payload.key !== undefined && payload.key !== null) {
		const err = validateProjectKey(payload.key);
		if (err) errors.push(err);
	}

	validateSprintFields(payload, errors);
	validateIconFields(payload, errors);

	return errors;
}
