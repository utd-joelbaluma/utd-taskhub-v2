import { supabase } from "../config/supabase.js";

// Verifies the authenticated user is a member of the project.
// Attaches req.membership. Must run after requireAuth.
export async function requireProjectMember(req, res, next) {
	const projectId = req.params.projectId || req.params.id;
	const userId = req.profile.id;

	const { data: membership, error } = await supabase
		.from("project_members")
		.select("*")
		.eq("project_id", projectId)
		.eq("user_id", userId)
		.maybeSingle();

	if (error) return next(error);

	if (!membership) {
		return res.status(403).json({
			success: false,
			message: "Access denied. You are not a member of this project.",
		});
	}

	req.membership = membership;
	next();
}

// Returns a middleware that allows only members with one of the given roles.
// Must run after requireProjectMember.
export function requireProjectRole(...roles) {
	return (req, res, next) => {
		if (!roles.includes(req.membership.role)) {
			return res.status(403).json({
				success: false,
				message: `Access denied. Required role: ${roles.join(" or ")}.`,
			});
		}
		next();
	};
}
