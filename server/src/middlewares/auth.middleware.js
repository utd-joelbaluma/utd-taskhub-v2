import { supabase } from "../config/supabase.js";

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
		await supabase.auth.getUser(token);

	if (authError || !authData?.user) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized. Invalid or expired token.",
		});
	}

	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("*")
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

	next();
}
