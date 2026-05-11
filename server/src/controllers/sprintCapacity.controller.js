import { getCapacitySummary } from "../services/sprintCapacity.service.js";
import { userHasGlobalPermission } from "../middlewares/permission.middleware.js";

export async function getMySprintCapacity(req, res, next) {
	try {
		const { userId } = req.params;

		if (userId !== req.profile.id) {
			const allowed = await userHasGlobalPermission(req, "users.read");
			if (!allowed) {
				return res.status(403).json({ success: false, message: "Access denied." });
			}
		}

		const data = await getCapacitySummary(req.supabaseAdmin, userId);

		if (!data) {
			return res.status(200).json({ success: true, data: null, message: "No active sprint." });
		}

		return res.status(200).json({ success: true, data });
	} catch (err) {
		next(err);
	}
}

export async function getTeamSprintCapacity(req, res, next) {
	try {
		const { data: profiles, error } = await req.supabaseAdmin
			.from("profiles")
			.select("id")
			.neq("status", "disabled");

		if (error) return next(error);

		const results = (
			await Promise.all(profiles.map((p) => getCapacitySummary(req.supabaseAdmin, p.id)))
		).filter(Boolean);

		return res.status(200).json({ success: true, count: results.length, data: results });
	} catch (err) {
		next(err);
	}
}
