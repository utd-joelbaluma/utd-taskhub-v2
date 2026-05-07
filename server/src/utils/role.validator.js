const ALLOWED_SCOPES = ["global", "project"];
const ROLE_KEY_RE = /^[a-z][a-z0-9_]*$/;
const PERMISSION_KEY_RE = /^[a-z][a-z0-9_.]*$/;

function validatePermissionKeys(permissionKeys, errors) {
	if (permissionKeys === undefined) return;

	if (!Array.isArray(permissionKeys)) {
		errors.push("permission_keys must be an array.");
		return;
	}

	for (const key of permissionKeys) {
		if (typeof key !== "string" || !PERMISSION_KEY_RE.test(key)) {
			errors.push("permission_keys must contain valid permission keys.");
			return;
		}
	}
}

export function validateCreateRole(payload) {
	const errors = [];

	if (!payload.scope || !ALLOWED_SCOPES.includes(payload.scope)) {
		errors.push(`scope must be one of: ${ALLOWED_SCOPES.join(", ")}.`);
	}

	if (!payload.key || typeof payload.key !== "string" || !ROLE_KEY_RE.test(payload.key)) {
		errors.push("key must be lowercase letters, numbers, or underscores and start with a letter.");
	}

	if (!payload.name || typeof payload.name !== "string" || payload.name.trim().length < 2) {
		errors.push("name must be at least 2 characters.");
	}

	if (
		payload.description !== undefined &&
		payload.description !== null &&
		typeof payload.description !== "string"
	) {
		errors.push("description must be a string.");
	}

	validatePermissionKeys(payload.permission_keys, errors);

	return errors;
}

export function validateUpdateRole(payload) {
	const errors = [];

	if (
		payload.name !== undefined &&
		(typeof payload.name !== "string" || payload.name.trim().length < 2)
	) {
		errors.push("name must be at least 2 characters.");
	}

	if (
		payload.description !== undefined &&
		payload.description !== null &&
		typeof payload.description !== "string"
	) {
		errors.push("description must be a string.");
	}

	if (payload.scope !== undefined || payload.key !== undefined || payload.is_system !== undefined) {
		errors.push("scope, key, and is_system cannot be updated.");
	}

	return errors;
}

export function validateSetRolePermissions(payload) {
	const errors = [];
	validatePermissionKeys(payload.permission_keys, errors);

	if (payload.permission_keys === undefined) {
		errors.push("permission_keys is required.");
	}

	return errors;
}
