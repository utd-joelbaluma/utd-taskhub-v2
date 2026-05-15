const VALID_TYPES = ["bug", "feature_request", "issue", "support", "other"];
const VALID_STATUSES = ["open", "in_review", "resolved", "closed", "cancelled"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const TICKET_CODE_RE = /^[A-Z0-9][A-Z0-9-]{0,29}$/;

export function validateTicketCode(code) {
	if (typeof code !== "string") return "Ticket code must be a string.";
	const trimmed = code.trim();
	if (trimmed.length < 2 || trimmed.length > 30) {
		return "Ticket code must be between 2 and 30 characters.";
	}
	if (!TICKET_CODE_RE.test(trimmed)) {
		return "Ticket code must be uppercase letters, digits, and dashes (e.g. WEB-001).";
	}
	return null;
}

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

	if (payload.ticket_code !== undefined && payload.ticket_code !== null && payload.ticket_code !== "") {
		const err = validateTicketCode(payload.ticket_code);
		if (err) errors.push(err);
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

	if (payload.ticket_code !== undefined && payload.ticket_code !== null) {
		const err = validateTicketCode(payload.ticket_code);
		if (err) errors.push(err);
	}

	return errors;
}

export function validateCloseTicket(payload) {
	const errors = [];

	if (payload.resolution !== undefined && payload.resolution !== null) {
		if (typeof payload.resolution !== "string") {
			errors.push("resolution must be a string.");
		} else if (payload.resolution.length > 2000) {
			errors.push("resolution must be 2000 characters or fewer.");
		}
	}

	return errors;
}
