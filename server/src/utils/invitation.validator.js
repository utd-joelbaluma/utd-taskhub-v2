const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ["owner", "manager", "member", "viewer"];

export function validateSendInvitation(payload) {
	const errors = [];

	if (!payload.email || typeof payload.email !== "string") {
		errors.push("Email is required.");
	} else if (!EMAIL_REGEX.test(payload.email.trim())) {
		errors.push("Email is invalid.");
	}

	if (payload.role !== undefined && !ALLOWED_ROLES.includes(payload.role)) {
		errors.push(`Role must be one of: ${ALLOWED_ROLES.join(", ")}.`);
	}

	return errors;
}

export function validateAcceptInvitation(payload) {
	const errors = [];

	if (!payload.token || typeof payload.token !== "string" || !payload.token.trim()) {
		errors.push("Invitation token is required.");
	}

	return errors;
}
