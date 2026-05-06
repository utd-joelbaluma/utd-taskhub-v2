const VALID_TYPES = ["bug", "feature_request", "issue", "support", "other"];
const VALID_STATUSES = ["open", "in_review", "resolved", "closed", "cancelled"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

export function validateCreateTicket(payload) {
	const errors = [];

	if (!payload.title || typeof payload.title !== "string") {
		errors.push("Title is required.");
	} else if (payload.title.trim().length < 2) {
		errors.push("Title must be at least 2 characters.");
	}

	if (payload.description !== undefined && payload.description !== null && typeof payload.description !== "string") {
		errors.push("Description must be a string.");
	}

	if (payload.type !== undefined && !VALID_TYPES.includes(payload.type)) {
		errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}.`);
	}

	if (payload.status !== undefined && !VALID_STATUSES.includes(payload.status)) {
		errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}.`);
	}

	if (payload.priority !== undefined && !VALID_PRIORITIES.includes(payload.priority)) {
		errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`);
	}

	if (payload.due_date !== undefined && payload.due_date !== null) {
		const d = new Date(payload.due_date);
		if (isNaN(d.getTime())) {
			errors.push("due_date must be a valid ISO date string.");
		}
	}

	return errors;
}

export function validateUpdateTicket(payload) {
	const errors = [];

	if (payload.title !== undefined) {
		if (typeof payload.title !== "string" || payload.title.trim().length < 2) {
			errors.push("Title must be at least 2 characters.");
		}
	}

	if (payload.description !== undefined && payload.description !== null && typeof payload.description !== "string") {
		errors.push("Description must be a string.");
	}

	if (payload.type !== undefined && !VALID_TYPES.includes(payload.type)) {
		errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}.`);
	}

	if (payload.status !== undefined && !VALID_STATUSES.includes(payload.status)) {
		errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}.`);
	}

	if (payload.priority !== undefined && !VALID_PRIORITIES.includes(payload.priority)) {
		errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`);
	}

	if (payload.due_date !== undefined && payload.due_date !== null) {
		const d = new Date(payload.due_date);
		if (isNaN(d.getTime())) {
			errors.push("due_date must be a valid ISO date string.");
		}
	}

	return errors;
}
