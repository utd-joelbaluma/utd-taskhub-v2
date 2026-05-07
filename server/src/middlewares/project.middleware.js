import { supabase } from "../config/supabase.js";
import { userHasGlobalPermission } from "./permission.middleware.js";

// Verifies the authenticated user is a member of the project.
// Attaches req.membership. Must run after requireAuth.
// Admin users bypass the membership check with a synthetic owner membership.
export async function requireProjectMember(req, res, next) {
	try {
		const projectId = req.params.projectId || req.params.id;
		const userId = req.profile.id;

		if (await userHasGlobalPermission(req, "projects.read_all")) {
			req.membership = {
				project_id: projectId,
				user_id: userId,
				role: "owner",
				is_global_bypass: true,
			};
			return next();
		}

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
	} catch (error) {
		next(error);
	}
}
