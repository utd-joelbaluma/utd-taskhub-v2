const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(payload) {
	const errors = [];

	if (!payload.email || typeof payload.email !== "string") {
		errors.push("Email is required.");
	} else if (!EMAIL_REGEX.test(payload.email.trim())) {
		errors.push("Email is invalid.");
	}

	if (!payload.password || typeof payload.password !== "string") {
		errors.push("Password is required.");
	} else if (payload.password.length < 8) {
		errors.push("Password must be at least 8 characters.");
	}

	if (
		payload.full_name !== undefined &&
		typeof payload.full_name === "string" &&
		payload.full_name.trim().length > 0 &&
		payload.full_name.trim().length < 2
	) {
		errors.push("Full name must be at least 2 characters.");
	}

	return errors;
}

export function validateLogin(payload) {
	const errors = [];

	if (!payload.email || typeof payload.email !== "string") {
		errors.push("Email is required.");
	} else if (!EMAIL_REGEX.test(payload.email.trim())) {
		errors.push("Email is invalid.");
	}

	if (!payload.password || typeof payload.password !== "string") {
		errors.push("Password is required.");
	}

	return errors;
}
