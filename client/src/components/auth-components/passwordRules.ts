export const passwordRules = [
	{ label: "At least 8 characters", test: (v: string) => v.length >= 8 },
	{ label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export function getPasswordStrength(password: string): number {
	return passwordRules.filter((r) => r.test(password)).length;
}

export const strengthLabels = ["", "Weak", "Fair", "Strong"];
export const strengthColors = ["", "bg-danger", "bg-warning", "bg-secondary"];
export const strengthTextColors = ["", "text-danger", "text-warning", "text-secondary"];
