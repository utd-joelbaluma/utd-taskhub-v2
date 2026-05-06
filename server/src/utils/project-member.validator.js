const ALLOWED_ROLES = ["owner", "manager", "member", "viewer"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateAddMember(payload) {
	const errors = [];

	if (!payload.user_id || !UUID_RE.test(payload.user_id)) {
		errors.push("user_id must be a valid UUID.");
	}

	if (payload.role !== undefined && !ALLOWED_ROLES.includes(payload.role)) {
		errors.push(`role must be one of: ${ALLOWED_ROLES.join(", ")}.`);
	}

	return errors;
}

export function validateUpdateMemberRole(payload) {
	const errors = [];

	if (!payload.role || !ALLOWED_ROLES.includes(payload.role)) {
		errors.push(`role must be one of: ${ALLOWED_ROLES.join(", ")}.`);
	}

	return errors;
}
