import { Router } from "express";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { register as registerSseClient } from "../services/sse-hub.service.js";

const router = Router();

router.get("/stream", async (req, res) => {
	const token = req.query.token;
	if (!token || typeof token !== "string") {
		return res.status(401).json({ success: false, message: "Missing token." });
	}

	const { data: authData, error: authError } =
		await supabaseAdmin.auth.getUser(token);

	if (authError || !authData?.user) {
		return res
			.status(401)
			.json({ success: false, message: "Invalid or expired token." });
	}

	registerSseClient(authData.user.id, req, res);
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
	try {
		const limit = Math.min(Number(req.query.limit) || 50, 100);
		const unreadOnly = req.query.unread === "true";
		const before = req.query.before;

		let query = supabase
			.from("notifications")
			.select("*")
			.eq("user_id", req.profile.id)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (unreadOnly) query = query.eq("read", false);
		if (before) query = query.lt("created_at", before);

		const { data, error } = await query;
		if (error) throw error;

		res.status(200).json({ success: true, count: data.length, data });
	} catch (err) {
		next(err);
	}
});

router.get("/unread-count", async (req, res, next) => {
	try {
		const { count, error } = await supabase
			.from("notifications")
			.select("id", { count: "exact", head: true })
			.eq("user_id", req.profile.id)
			.eq("read", false);

		if (error) throw error;

		res.status(200).json({ success: true, data: { count: count ?? 0 } });
	} catch (err) {
		next(err);
	}
});

router.post("/read-all", async (req, res, next) => {
	try {
		const { error } = await supabase
			.from("notifications")
			.update({ read: true })
			.eq("user_id", req.profile.id)
			.eq("read", false);

		if (error) throw error;

		res.status(200).json({ success: true, message: "All notifications marked read." });
	} catch (err) {
		next(err);
	}
});

router.post("/:id/read", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from("notifications")
			.update({ read: true })
			.eq("id", id)
			.eq("user_id", req.profile.id)
			.select()
			.maybeSingle();

		if (error) throw error;
		if (!data) {
			return res
				.status(404)
				.json({ success: false, message: "Notification not found." });
		}

		res.status(200).json({ success: true, data });
	} catch (err) {
		next(err);
	}
});

export default router;
