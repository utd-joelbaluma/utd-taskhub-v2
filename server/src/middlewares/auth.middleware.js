import {
	createSupabaseForToken,
	setRequestSupabase,
	supabaseAdmin,
} from "../config/supabase.js";
import { userHasGlobalPermission } from "./permission.middleware.js";

export async function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized. No token provided.",
		});
	}

	const token = authHeader.split(" ")[1];

	const { data: authData, error: authError } =
		await supabaseAdmin.auth.getUser(token);

	if (authError || !authData?.user) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized. Invalid or expired token.",
		});
	}

	const userSupabase = createSupabaseForToken(token);

	const { data: profile, error: profileError } = await supabaseAdmin
		.from("profiles")
		.select("*, global_role:roles!profiles_role_id_fkey(id, key, name, scope)")
		.eq("id", authData.user.id)
		.maybeSingle();

	if (profileError || !profile) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized. User profile not found.",
		});
	}

	if (profile.status === "disabled") {
		return res.status(403).json({
			success: false,
			message: "Your account has been disabled.",
		});
	}

	req.user = authData.user;
	req.profile = profile;
	req.token = token;
	req.supabase = userSupabase;
	req.supabaseAdmin = supabaseAdmin;
	setRequestSupabase(userSupabase);

	next();
}

export function requireAdmin(req, res, next) {
	return userHasGlobalPermission(req, "roles.manage")
		.then((allowed) => {
			if (!allowed) {
				return res.status(403).json({
					success: false,
					message: "Admin access required.",
				});
			}
			next();
		})
		.catch(next);
}
